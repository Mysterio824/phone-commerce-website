const express = require("express");
const productController = require("../controllers/productController");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../../application/enums/roles");

const router = express.Router();

// Public routes (no authorization required)
router.get("/", productController.getProducts);
router.get("/:id", productController.getDetail);

// Admin-only routes
router.post(
  "/add",
  authorize({ roles: ROLES.ADMIN }),
  productController.postAddProduct
);
router.put(
  "/:id/edit",
  authorize({ roles: ROLES.ADMIN }),
  productController.putEditProduct
);
router.delete(
  "/:id/delete",
  authorize({ roles: ROLES.ADMIN }),
  productController.deleteProduct
);

module.exports = router;
