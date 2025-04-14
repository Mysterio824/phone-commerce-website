const userController = require('../controllers/userController');

const router = require('express').Router();
router.get('/profile', userController.getDetail);

router.get('/checkout', userController.getCheckout);

router.get('/thankyou', userController.getThankYou)

module.exports = router;