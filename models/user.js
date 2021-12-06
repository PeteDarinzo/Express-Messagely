/** User class for message.ly */

const { BCRYPT_WORK_FACTOR, DB_URI } = require("../config");
const bcrypt = require("bcrypt");
const db = require("../db");
const ExpressError = require("../expressError");


/** User of the site. */

class User {


  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    try {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

      const results = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]);

      (results.rows[0]).password = password; // set password to the user's password, not the hashed one

      return results.rows[0];

    } catch (e) {
      if (e.code === "23505") { // Postgresql error for bad insertion
        return new ExpressError("Username taken.", 400);
      }
    }
  }


  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {

    const results = await db.query(
      `SELECT username, password
      FROM users
      WHERE username=$1`,
      [username]);

    const user = results.rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      return true;
    } else {
      return false;
    }
  }


  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    const result = await db.query(`
    UPDATE users
    SET last_login_at = current_timestamp
    WHERE username = $1
    RETURNING username`,
      [username]);

    if (result.rows.length === 0) {
      throw new ExpressError("No such user", 404);
    }
  }


  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`
    SELECT username, first_name, last_name, phone
    FROM users;`);

    return results.rows;
  }


  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username = $1`,
      [username]);
    if (result.rows.length === 0) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }
    return result.rows[0];
  }


  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

    const msgResults = await db.query(` 
    SELECT m.id, m.body, m.sent_at, m.read_at, u.username as to_user
    FROM messages as m
    INNER JOIN users as u
    ON m.to_username = u.username
    WHERE m.from_username = $1`,
      [username]);

    for (let msg of msgResults.rows) {
      const userResults = await db.query(`
        SELECT username, first_name, last_name, phone
        FROM users
        WHERE username=$1`,
        [msg.to_user]);
      msg.to_user = userResults.rows[0];
    }

    return msgResults.rows;
  }

  
  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const msgResults = await db.query(`
    SELECT m.id, m.body, m.sent_at, m.read_at, u.username as from_user
    FROM messages as m
    INNER JOIN users as u
    ON m.from_username = u.username
    WHERE m.to_username = $1`,
      [username]);

    for (let msg of msgResults.rows) {
      const userResults = await db.query(`
        SELECT username, first_name, last_name, phone
        FROM users
        WHERE username=$1`,
        [msg.from_user]);
      msg.from_user = userResults.rows[0];
    }

    return msgResults.rows;
  }
}


module.exports = User;