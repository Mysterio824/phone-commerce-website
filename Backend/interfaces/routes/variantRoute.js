const express = require("express");
const variantController = require("../controllers/variantController");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../../application/enums/roles");

const router = express.Router();

// Public routes
router.get("/product/:productId", variantController.getProductVariants);
router.get("/:id", variantController.getVariantById);

// Admin routes
router.post(
  "/add",
  authorize({ roles: ROLES.ADMIN }),
  variantController.createVariant
);
router.put(
  "/:id/edit",
  authorize({ roles: ROLES.ADMIN }),
  variantController.updateVariant
);
router.delete(
  "/:id/delete",
  authorize({ roles: ROLES.ADMIN }),
  variantController.deleteVariant
);
router.patch(
  "/:id/stock",
  authorize({ roles: ROLES.ADMIN }),
  variantController.updateVariantStock
);

module.exports = router;
