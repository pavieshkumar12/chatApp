const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const bcrypt = require("bcryptjs");
const { createToken, verifyToken } = require("../config/jwt");
const { sendMail } = require("../config/mailer");
const { getRandomString } = require("../config/pwdHandler");
const { COOKIE_OPTIONS } = require("../config/cookie");
const { addToBlacklist, isTokenBlacklisted } = require("../config/token");
require('dotenv').config();

const signup = async (req, res, next) => {
    try {
        const { email, password, name, employeeId, role } = req.body;
        if (!email || !password || !name || !employeeId || !role) {
            return res.status(401).send({ message: 'Details Missing' });
        }

        let image 

        // Check if req.file is present (uploaded image)
        if (req.file) {
            image = req.file.path; // Use the path from multer to store in the database
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email, password: hashedPassword, name, image, employeeId, role
        });

        res.status(200).json(user);

    } catch (err) {
        next(err);
    }
};


const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ message: 'Details Missing' });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).send({ message: 'User not Found' });
        }
        const isPasswordIsValid = await bcrypt.compare(password, user.password);
        if (!isPasswordIsValid) {
            return res.status(400).send({ message: 'Incorrect Username and Password' });
        }

        const token = await createToken({ id: user._id });

        // Set the userId in a cookie
        res.cookie("id", user._id.toString(), COOKIE_OPTIONS);
        res.cookie("token", token.toString(), COOKIE_OPTIONS);
        // res.json({ token });
        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                token: token
            }
        });
    }
    catch (err) {
        next(err);
    }
}

const allUsers = async (req, res, next) => {
    try {
        // Extract the search query parameter from the request
        const { search } = req.query;

        // Create an array of search terms by splitting on spaces
        const searchTerms = search ? search.split(' ').filter(term => term !== '') : [];

        // Create a filter object based on the presence of the search parameter
        const filter = searchTerms.length > 0
            ? { name: { $all: searchTerms.map(term => new RegExp(term, 'i')) } }
            : {};

        // Use the filter in the User.find() query
        const users = await User.find(filter);

        // Find the group chat with the specified chatName
        const chatNameFilter = searchTerms.length > 0 ? { chatName: new RegExp(search, 'i'), isGroupChat: true } : {};

        const groupChats = await Chat.find(chatNameFilter);

        // Filter groupChats array to include only those with isGroupChat: true
        const filteredGroupChats = groupChats.filter(chat => chat.isGroupChat);


        res.status(200).json({
            users,
            groupChats: filteredGroupChats,
        });
    } catch (err) {
        next(err);
    }
};


const editUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const updateFields = req.body;

        // Check if req.file is present (uploaded image)
        if (req.file) {
            updateFields.image = req.file.path; // Use the path from multer to store in the database
        }

        // Check if a new password is provided before hashing
        if (updateFields.password) {
            // Generate a salt
            const saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);

            // Hash the password with the generated salt
            const hashedPassword = await bcrypt.hash(updateFields.password, salt);

            // Update the password in the updateFields
            updateFields.password = hashedPassword;
        }

        // Update the user with the provided fields
        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        next(err);
    }
}


const forgetPassword = async (req, res, next) => {
    try {
        const email = req.body.email;
        console.log(email);
        const randomPassword = getRandomString();
        const password = randomPassword.replace(/["'`~]/g, '');

        // Generate a salt
        const saltRounds = 10; // You can adjust the number of rounds as needed
        const salt = await bcrypt.genSalt(saltRounds);

        // Hash the password with the generated salt
        const hashing = await bcrypt.hash(password, salt);

        const user = await User.findOneAndUpdate({ email: email }, { password: hashing },
            {
                new: true,
            });

        if (!user) {
            return res.status(400).send({ message: 'User not Found' });
        }

        const msg = {
            to: user.email,
            from: "paviesh@throughbit.com",
            subject: "Your account password has been reset",
            html: `<strong>Your new password is ${password} </strong>`,
        };

        const isMail = await sendMail(msg);
        if (!isMail) {
            return res.status(400).send({
                message: `Error occurred while sending the new password for ${email}`,
            });
        }
        return res
            .status(200)
            .send({ message: `Password has been sent to ${email}` });
    } catch (err) {
        next(err);
    }
}

const changePwd = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const { currentPassword, newPassword } = req.body;

        // Find the user by userId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare the current password
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password with the new hashed password
        user.password = hashedPassword;

        // Save the updated user
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        next(err);
    }
};

const signOut = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        console.log("token", token);

        // Check if the token is already blacklisted
        if (await isTokenBlacklisted(token)) {
            res.status(401).send({ message: 'Token is already blacklisted' });
            return;
        }

        // Add the token to the blacklist
        await addToBlacklist(token);

        // Clear the cookie in the response
        res.clearCookie('id');
        res.clearCookie('token');

        res.status(201).send({ message: 'User logged out successfully' });
    } catch (err) {
        next(err);
    }
};


const protect = async (req, res, next) => {
    let token;
    try {
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];

            // Check if the token is blacklisted
            if (await isTokenBlacklisted(token)) {
                res.status(401);
                return next(new Error('Not authorized, token blacklisted'));
            }

            const decoded = await verifyToken(token); // Use verifyToken function from jwt

            req.user = await User.findById(decoded.id).select('-password');
            // console.log("req.user", req.user);
            next();
        }
    } catch (error) {
        res.status(401);
        return next(new Error('Not authorized, token failed'));
    }

    if (!token) {
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }
};



const getUserProfile = async (req, res, next) => {
    try {
        const getUserId = req.params.userId;
        const getUserProfile = await User.findById(getUserId, 'id name image role password employeeId');

        if (!getUserProfile) {
            return res.status(404).json({ message: "User is not found" });
        }


        res.status(200).json({
            id: getUserProfile.id,
            name: getUserProfile.name,
            image: getUserProfile.image,
            password: getUserProfile.password,
            role: getUserProfile.role,
            employeeId: getUserProfile.employeeId,
        });

    } catch (err) {
        next(err);
    }
}


module.exports = { signup, signIn, signOut, protect, allUsers, editUser, getUserProfile, changePwd, forgetPassword }