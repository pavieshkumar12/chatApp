const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");


const getAllMessages = async (req, res, next) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name image email")
            .populate("chat");
        res.json(messages);
    } catch (err) {
        next(err)
    }
}


const sendMsg = async (req, res, next) => {
    try {
        const { content, chatId } = req.body;

        if (!content || !chatId) {
            console.log("Invalid data passed into request");
            return res.sendStatus(400);
        }

        let newMessage = {
            sender: req.user._id,
            content: content,
            chat: chatId,
        };

        let message = await Message.create(newMessage);

        // Use populate on the Message model, not on the instance
        message = await Message.populate(message, [
            { path: "sender", select: "name image" },
            { path: "chat" },
        ]);

        // Populate users in the chat
        message = await User.populate(message, {
            path: "chat.users",
            select: "name image email",
        });

        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

        res.json(message);
    } catch (err) {
        next(err);
    }
};


module.exports = { getAllMessages, sendMsg }