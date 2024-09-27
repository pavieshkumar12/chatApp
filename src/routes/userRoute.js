const express = require("express");
const { celebrate, Joi, errors, Segments } = require('celebrate');
const { signup, signIn, editUser, forgetPassword, allUsers, signOut, protect, getUserProfile, changePwd } = require("../controllers/userController")
const { upload } = require("../config/multer");
const router = express.Router();


router.post("/createUser",
    upload.single("image"),
    celebrate({
        [Segments.BODY]: Joi.object().keys({
            name: Joi.string().required(),
            email: Joi.string().email({ tlds: { allow: false } }).required(),
            password: Joi.string().required(),
            employeeId: Joi.string().required(),
            role: Joi.string().required(),
            image: Joi.string().allow('').optional(),
        }),
    }), signup);

router.post("/login", celebrate({
    [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email({ tlds: { allow: false } }).required(),
        password: Joi.string().required(),
    }),
}), signIn);

router.get("/getAllusers", protect, allUsers);

router.get("/getUserProfile/:userId", protect, getUserProfile);

router.put("/editUser/:userId", celebrate({
    [Segments.BODY]: Joi.object().keys({
        name: Joi.string().allow('').optional(),
        role: Joi.string().allow('').optional(),
        image: Joi.string().allow('').optional(),
        password: Joi.string().allow('').optional(),
        employeeId: Joi.string().allow('').optional(),
    }),
}), upload.single("image"), protect, editUser);

router.post("/forgetPwd", celebrate({
    [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email({ tlds: { allow: false } }).required(),
    }),
}), forgetPassword);

router.put("/changePwd/:userId", protect, changePwd)


router.post("/logOut", signOut);


router.use(errors());

module.exports = router;
