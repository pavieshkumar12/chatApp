const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(500).json({ message: 'Invalid user information' });
        }

        let isChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        })
            .populate("users", "-password")
            .populate("latestMessage");


        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "name image email",
        });

        if (isChat.length > 0) {
            res.send(isChat[0]);
        } else {
            var chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId],
            };
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "-password"
            );
            res.status(200).json(FullChat);
        }
    } catch (err) {
        next(err);
    }
};

const accessGroupChat = async (req, res, next) => {
    try {
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({ message: 'Invalid group information' });
        }

        // Query the Chat model to find the group with the provided groupId
        const group = await Chat.findById(groupId).populate("users", "-password");

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if req.user._id is in the users array of the group
        const userInGroup = group.users.some(user => user._id.toString() === req.user._id.toString());

        if (!userInGroup) {
            return res.status(403).json({ message: 'User not authorized to access this group' });
        }

        res.status(200).json(group);
    } catch (err) {
        next(err);
    }
}



const fetchChats = async (req, res, next) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name image email",
                });
                res.status(200).send(results);
            });
    } catch (err) {
        next(err);
    }
}

const createGroup = async (req, res, next) => {
    try {
        if (!req.body.users || !req.body.name) {
            return res.status(400).send({ message: "Please Fill all the feilds" });
        }

        let image 

        // Check if req.file is present (uploaded image)
        if (req.file) {
            image = req.file.path; // Use the path from multer to store in the database
        }

        let users = JSON.parse(req.body.users);
        // console.log("users", users);



        if (users.length < 2) {
            return res
                .status(400)
                .send("More than 2 users are required to form a group chat");
        }

        users.push(req.user);

        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
            image: image,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password",)
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);
    } catch (err) {
        next(err)
    }
}


const renameGroup = async (req, res, next) => {
    try {
        const { chatId, chatName } = req.body;

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                chatName: chatName,
            },
            {
                new: true,
            }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!updatedChat) {
            res.status(404);
            throw new Error("Chat Not Found");
        } else {
            res.json(updatedChat);
        }
    } catch (err) {
        next(err);
    }
}


const removeGroupMember = async (req, res, next) => {
    try {
        const { chatId, userId } = req.body;

        // check if the requester is admin

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            {
                $pull: { users: userId },
            },
            {
                new: true,
            }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!removed) {
            res.status(404);
            throw new Error("Chat Not Found");
        } else {
            res.json(removed);
        }
    } catch (err) {
        next(err)
    }
}


const addGroupMember = async (req, res, next) => {
    try {
        const { chatId, userId } = req.body;

        // check if the requester is admin

        const added = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { users: userId },
            },
            {
                new: true,
            }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!added) {
            res.status(404);
            throw new Error("Chat Not Found");
        } else {
            res.json(added);
        }

    } catch (err) {
        next(err)
    }
}




module.exports = { accessChat, fetchChats, createGroup, accessGroupChat, renameGroup, removeGroupMember, addGroupMember }

