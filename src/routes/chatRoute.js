const express = require("express");
const { accessChat, fetchChats, createGroup,accessGroupChat, renameGroup, removeGroupMember, addGroupMember } = require("../controllers/chatController");
const { protect } = require("../controllers/userController");
const { celebrate, Joi, errors, Segments } = require('celebrate');
const { upload } = require("../config/multer");
const router = express.Router();


router.post("/accessChat", celebrate({
    [Segments.BODY]: Joi.object().keys({
        userId: Joi.string().required(),
    }),
}), protect, accessChat);

router.post("/accessGroupChat", celebrate({
    [Segments.BODY]: Joi.object().keys({
        groupId: Joi.string().required(),
    }),
}), protect, accessGroupChat);

router.get("/fetchChats", protect, fetchChats);

router.post("/createGroup",
    upload.single("image"),
    celebrate({
        [Segments.BODY]: Joi.object().keys({
            name: Joi.string().required(),
            users: Joi.string().required(),
            image: Joi.string().allow('').optional(),
        }),
    }), protect, createGroup);

router.put("/renameGroup", celebrate({
    [Segments.BODY]: Joi.object().keys({
        chatId: Joi.string().required(),
        chatName: Joi.string().required(),
    }),
}), protect, renameGroup);

router.put("/removeGroupMember", celebrate({
    [Segments.BODY]: Joi.object().keys({
        chatId: Joi.string().required(),
        userId: Joi.string().required(),
    }),
}), protect, removeGroupMember);

router.put("/addGroupMember", celebrate({
    [Segments.BODY]: Joi.object().keys({
        chatId: Joi.string().required(),
        userId: Joi.string().required(),
    }),
}), protect, addGroupMember)


module.exports = router;