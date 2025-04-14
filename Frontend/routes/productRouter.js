const productController = require('../controllers/productController');

const router = require('express').Router();
router.get('/:id', productController.getDetail);

module.exports = router;