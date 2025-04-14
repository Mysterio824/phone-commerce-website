const productController = require('../controllers/productController');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs'); // Folder where files will be saved
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

const router = require('express').Router();
router.post('/upload', upload.array('files[]'), productController.uploadImg);
router.post('/api', productController.getProducts);
router.get('/:id', productController.getDetail);
router.put('/edit/:id', productController.putEditProduct);
router.post('/add', productController.postAddProduct);
router.delete('/delete', productController.deleteProduct);

module.exports = router;