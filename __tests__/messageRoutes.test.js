process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { SECRET_KEY } = require("../config");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


let testUser1Token;
let testUser2Token;
let testUser3Token;
let m1;
let m2;


describe("Message Routes Test", function () {

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

        let u3 = await User.register({
            username: "test3",
            password: "password",
            first_name: "Test3",
            last_name: "Testy3",
            phone: "+14155552222",
        });

        m1 = await Message.create({
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
        testUser3Token = jwt.sign({ username: "test3" }, SECRET_KEY);
    });



    describe("GET messages/:id", function () {

        test("can get a single message by id", async function () {
            let response = await request(app).get(`/messages/${m1.id}`).send({ _token: testUser1Token });

            let message = response.body.message;

            expect(response.statusCode).toBe(200);
            expect(message).toEqual({
                id: expect.any(Number),
                body: "Message from u1 -> u2",
                sent_at: expect.any(String),
                read_at: null,
                from_user: {
                    username: "test1",
                    first_name: "Test1",
                    last_name: "Testy1",
                    phone: "+14155550000",
                },
                to_user: {
                    username: "test2",
                    first_name: "Test2",
                    last_name: "Testy2",
                    phone: "+14155551111",
                }
            });
        });

        test("can't get a message with invalid id", async function () {
            let response = await request(app).get("/messages/111").send({ _token: testUser1Token });
            expect(response.statusCode).toBe(404);
        });


        test("can't get another user's messages", async function () {
            let response = await request(app).get(`/messages/${m1.id}`).send({ _token: testUser3Token });
            expect(response.statusCode).toBe(401);
        });

    });

    describe("POST /messages", function () {

        test("Can post a new message", async function () {
            let response = await request(app).post("/messages").send({
                _token: testUser1Token,
                to_username: "test2",
                body: "A second test message from u1 -> u2"
            });

            let message = response.body.message;

            expect(response.statusCode).toBe(200);
            expect(message).toEqual(
                {
                    id: expect.any(Number),
                    from_username: "test1",
                    to_username: "test2",
                    body: "A second test message from u1 -> u2",
                    sent_at: expect.any(String)
                });
        });
    });


    describe("POST /messages/:id/read", function () {

        test("Can mark a message as read", async function () {
            let response = await request(app).post(`/messages/${m1.id}/read`).send({ _token: testUser1Token });

            let readStatus = response.body.readStatus;

            expect(response.statusCode).toBe(200);
            expect(readStatus).toEqual({
                id: m1.id,
                read_at: expect.any(String)
            });
        });

        test("can't mark a message read with invalid id", async function () {
            let response = await request(app).post(`/messages/111`).send({ _token: testUser1Token });
            expect(response.statusCode).toBe(404);
        });

        test("Can mark a message as read", async function () {
            let response = await request(app).post(`/messages/${m1.id}/read`).send({ _token: testUser2Token });
            expect(response.statusCode).toBe(401);
        });

    });
});




afterAll(async function () {
    await db.end();
});