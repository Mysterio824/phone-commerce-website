const authController = require("../controllers/authController");

const router = require("express").Router();

router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleCallback);
router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.get("/logout", authController.logout);
router.post("/refresh-token", authController.refresh);
router.post("/confirm", authController.verifyAccount);

module.exports = router;
