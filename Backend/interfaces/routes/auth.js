const router = require('express').Router();
const authController = require('../controllers/authController');

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.get('/logout', authController.logout);
router.post('/refresh-token', authController.refresh);
router.get('/confirm/:token', authController.verifyAccount);

module.exports = router;