const cartController = require('../controllers/cartController');

const router = require('express').Router();
router.post('/', cartController.getCartData);    
router.post('/add', cartController.addProduct);
router.put('/update', cartController.updateProduct);
router.delete('/delete', cartController.deleteProduct);

module.exports = router;