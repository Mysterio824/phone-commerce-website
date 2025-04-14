const cartController = require('../controllers/cartController');
const router = require('express').Router();

router.get('/', cartController.getCart);

module.exports = router;