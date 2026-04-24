// lib/cloudinary.js
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "farmbridge/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 900, height: 675, crop: "limit", quality: "auto:good" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only JPEG, PNG, WebP images allowed"), false);
  },
});

module.exports = { cloudinary, upload };
