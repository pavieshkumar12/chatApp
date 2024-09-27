require('dotenv').config();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'marmachatapp',
        allowedFormats: ['jpeg', 'png', 'jpg', 'svg'],
    }
});

const upload = multer({ storage }); // Create multer middleware

module.exports = {
    upload
};