const express = require("express");
const brandController = require("../controllers/brandController");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../../application/enums/roles");

const router = express.Router();

router.get("/", authorize({ roles: ROLES.ADMIN }), brandController.getAll);
router.get(
  "/:id",
  authorize({ roles: ROLES.ADMIN }),
  brandController.getDetail
);
router.post(
  "/add",
  authorize({ roles: ROLES.ADMIN }),
  brandController.addBrand
);
router.put(
  "/:id/update",
  authorize({ roles: ROLES.ADMIN }),
  brandController.updateBrand
);
router.delete(
  "/:id/delete",
  authorize({ roles: ROLES.ADMIN }),
  brandController.deleteBrand
);

module.exports = router;
