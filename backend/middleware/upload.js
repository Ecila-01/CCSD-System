const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config(); // Make sure it can read your .env file

// 1. Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Set up the Cloudinary Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ccsd_uploads', // This will create a specific folder in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'], // Restrict file types for security
  },
});

const upload = multer({ storage: storage });

module.exports = upload;