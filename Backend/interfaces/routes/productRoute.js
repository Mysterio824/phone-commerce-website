const express = require('express');
const productController = require('../controllers/productController');
const restrictTo = require('../middlewares/JwtMiddleware');
const ROLES = require('../../application/enums/roles');

const router = express.Router();

// Public routes
router.post('/', productController.getProducts);
router.get('/:id', productController.getDetail);

// Admin-only routes
router.put('/edit/:id', productController.putEditProduct);
router.post('/add', productController.postAddProduct);
router.delete('/delete', productController.deleteProduct);

module.exports = router;