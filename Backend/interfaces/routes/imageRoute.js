const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');


const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

router.post('/upload', upload.array('files[]'), imageController.uploadImg);