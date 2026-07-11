const cloudinary = require('cloudinary').v2;
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// SVG intentionally excluded — it can carry embedded scripts (stored XSS).
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

// Files are held in memory (max 5 MB) and streamed straight to Cloudinary.
// This replaces multer-storage-cloudinary, which is unmaintained and only
// declares a cloudinary v1 peer dependency (breaks `npm install` on strict
// npm hosts). Uploading through the official v2 SDK removes that conflict.
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported image format'));
  },
});

// Streams the buffered file to Cloudinary, then mirrors the fields that
// multer-storage-cloudinary used to set so existing routes keep working:
//   req.file.path     -> secure URL (routes read this)
//   req.file.filename -> public_id  (folder/<id>, matches delete logic)
function sendToCloudinary(req, next) {
  if (!req.file) return next();
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'ccsd_uploads',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
    },
    (err, result) => {
      if (err) return next(err);
      req.file.path = result.secure_url;
      req.file.filename = result.public_id;
      next();
    }
  );
  stream.end(req.file.buffer);
}

// Same interface as before: upload.single('image') returns ONE middleware
// function, so it works both mounted on a route (career, services, /api/upload)
// and invoked manually as upload.single('image')(req, res, cb) (announcements).
module.exports = {
  single: (field) => (req, res, next) => {
    multerUpload.single(field)(req, res, (err) => {
      if (err) return next(err);
      sendToCloudinary(req, next);
    });
  },
};
