const express = require("express");
const { protect } = require("../controllers/userController");
const { getAllMessages, sendMsg } = require("../controllers/messageController");
const { celebrate, Joi, errors, Segments } = require('celebrate');
const router = express.Router();

router.get("/getMessages/:chatId", protect, getAllMessages);

router.post("/sendMsg", celebrate({
    [Segments.BODY]: Joi.object().keys({
        content: Joi.string().required(),
        chatId: Joi.string().required(),
    }),
}), protect, sendMsg)



module.exports = router;