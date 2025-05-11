const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "assignments",
    resource_type: file.mimetype.startsWith("image/") ? "image" : "raw", // Auto-detect type
    access_mode: "public", // 👈 Makes ALL uploads public
    allowed_formats: ["pdf", "docx", "jpg", "png", "gif", "webp"],
    public_id: `assignment_${Date.now()}_${file.originalname.split('.')[0]}`,
  }),
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed."), false);
    }
    cb(null, true);
  }
});


module.exports = {
  cloudinary,
  upload,
};
