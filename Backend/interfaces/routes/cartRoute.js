const cartController = require('../controllers/cartController');

const router = require('express').Router();
router.post('/', cartController.getCartData);    
router.post('/update', cartController.updateProduct);
router.put('/add', cartController.addProduct);
router.delete('/delete', cartController.deleteProduct);

module.exports = router;