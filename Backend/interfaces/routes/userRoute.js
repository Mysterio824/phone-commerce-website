const userController = require('../controllers/userController');

const router = require('express').Router();
router.get('/profile', userController.getDetail);
router.get('/checkout', userController.getCheckout);
router.put('/update', userController.updateDetail);
router.delete('/delete', userController.deleteUser);

module.exports = router;