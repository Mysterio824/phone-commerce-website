const express = require("express");
const userController = require("../controllers/userController");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../../application/enums/roles");

const router = express.Router();
// User can only access their own data
router.get(
  "/:id",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  userController.getDetail
);

router.put(
  "/:id/edit",
  authorize({
    policy: "OwnResource",
    data: (req) => req.params.id,
  }),
  userController.updateDetail
);

// Admin routes
router.get("/", authorize({ roles: ROLES.ADMIN }), userController.getAllUsers);

router.delete(
  "/:id/delete",
  authorize({
    policy: "AdminOrOwner",
    data: (req) => req.params.id,
  }),
  userController.deleteUser
);

module.exports = router;
