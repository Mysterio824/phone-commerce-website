const authController = require('../controllers/authController');
const router = require('express').Router();

router.get('/', authController.getAuth);

router.get('/confirm/:token', authController.confirm);

router.get('/verify/:name', authController.verifyEmail);

// router.get('/logout', authController.logout);

module.exports = router;