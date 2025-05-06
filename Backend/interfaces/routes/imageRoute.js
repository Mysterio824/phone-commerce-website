const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const imageController = require("../controllers/imageController");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../../application/enums/roles");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "public", "imgs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Generate unique filename
const generateUniqueFilename = (originalname) => {
  const fileExt = path.extname(originalname);
  const uniqueId = crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + "-" + crypto.randomBytes(8).toString("hex");

  return uniqueId + fileExt;
};

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  },
});
const upload = multer({ storage });

// Routes
router.get("/:imageName", imageController.getImageById);

router.post(
  "/upload",
  authorize({ roles: ROLES.ADMIN }),
  upload.array("files"),
  imageController.uploadImg
);

module.exports = router;
