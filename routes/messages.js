const express = require("express");
// @ts-ignore
const router = new express.Router();
const ExpressError = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Message = require("../models/message");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const msg = await Message.get(id);

        if (req.user.username !== msg.from_user.username && req.user.username !== msg.to_user.username) {
            throw new ExpressError("Unauthorized.", 401);
        }

        res.json({ message: msg });
    } catch (e) {
        next(e);
    }
});





/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async (req, res, next) => {
    const { to_username, body } = req.body;
    const msgObj = { from_username: req.user.username, to_username, body }
    const msg = await Message.create(msgObj);
    res.json({ message: msg });
});




/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params;
        const msg = await Message.get(id);

        if (req.user.username !== msg.from_user.username) {
            throw new ExpressError("Unauthorized.", 401);
        }

        const readStatus = await Message.markRead(id);

        res.json({ readStatus });
    } catch (e) {
        next(e);
    }

});


module.exports = router;