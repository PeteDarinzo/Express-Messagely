
const express = require("express");
// @ts-ignore
const router = new express.Router();
const ExpressError = require("../expressError");
// const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const User = require("../models/user");



/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            throw new ExpressError("Username and password required.", 400);
        }
        let authenticated = await User.authenticate(username, password);
        if (authenticated) {
            const token = jwt.sign({ username }, SECRET_KEY);
            await User.updateLoginTimestamp(username);
            res.json({ token });
        } else {
            throw new ExpressError("Invalid username or password", 400);
        }
    } catch (e) {
        next(e);
    }
});





/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        if (!username || !password) {
            throw new ExpressError("Username and password required.", 400);
        }
        await User.register(req.body);
        const token = jwt.sign({ username }, SECRET_KEY);
        await User.updateLoginTimestamp(username);
        res.json({ token });
    } catch (e) {
        next(e);
    }
});

module.exports = router;