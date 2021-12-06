process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

let testUser1Token;
let testUser2Token;

describe("User Routes Test", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155551111",
    });

    let m1 = await Message.create({
      from_username: u1.username,
      to_username: u2.username,
      body: "Message from u1 -> u2"
    });

    let m2 = await Message.create({
      from_username: u2.username,
      to_username: u1.username,
      body: "Message from u2 -> u1"
    });

    testUser1Token = jwt.sign({ username: "test1" }, SECRET_KEY);
    testUser2Token = jwt.sign({ username: "test2" }, SECRET_KEY);
  });



  describe("GET /users", function () {

    test("can get list of users", async function () {
      let response = await request(app).get("/users").send({ _token: testUser1Token }); // ALL requests need _token in teq.body per app.use(authenticateJWT)

      let users = response.body.users;
      expect(response.statusCode).toBe(200);
      expect(users.length).toBe(2);
      expect(users).toEqual([
        {
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000"
        },
        {
          username: "test2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155551111"
        }
      ]);
    });

    test("can't get list of users if not logged in", async function () {
      let response = await request(app).get("/users");
      expect(response.statusCode).toBe(401);
    });

  });



  describe("GET users/:username", function () {

    test("can get a single user", async function () {
      let response = await request(app).get("/users/test1").send({ _token: testUser1Token });

      let user = response.body.user;

      expect(response.statusCode).toBe(200);
      expect(user).toEqual({
        username: "test1",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14155550000",
        join_at: expect.any(String),
        last_login_at: expect.any(String)
      });
    });

    test("can't get a user with incorrect token", async function () {
      let response = await request(app).get("/users/test1").send({ _token: testUser2Token });
      expect(response.statusCode).toBe(401);
    });

  });


  describe("GET users/:username/to", function () {

    test("can get a single user's to messages", async function () {
      let response = await request(app).get("/users/test1/to").send({ _token: testUser1Token });

      let messages = response.body.messages;

      expect(response.statusCode).toBe(200);

      expect(messages.length).toBe(1);

      expect(messages).toEqual([{
        id: expect.any(Number),
        body: "Message from u2 -> u1",
        sent_at: expect.any(String),
        read_at: null,
        from_user: {
          username: "test2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155551111"
        }
      }]);
    });

    test("can't get a different user's messages ", async function () {
      let response = await request(app).get("/users/test1/to").send({ _token: testUser2Token });
      expect(response.statusCode).toBe(401);
    });

  });


  describe("GET users/:username/from", function () {
    
    test("can get a single user's from messages", async function () {
      let response = await request(app).get("/users/test1/from").send({ _token: testUser1Token });

      let messages = response.body.messages;

      expect(response.statusCode).toBe(200);

      expect(messages.length).toBe(1);

      console.log(messages);

      expect(messages).toEqual([{
        id: expect.any(Number),
        body: "Message from u1 -> u2",
        sent_at: expect.any(String),
        read_at: null,
        to_user: {
          username: "test2",
          first_name: "Test2",
          last_name: "Testy2",
          phone: "+14155551111"
        }
      }]);
    });

    test("can't get a different user's messages", async function () {
      let response = await request(app).get("/users/test1/from").send({ _token: testUser2Token });
      expect(response.statusCode).toBe(401);
    });

  });

});


afterAll(async function () {
  await db.end();
});