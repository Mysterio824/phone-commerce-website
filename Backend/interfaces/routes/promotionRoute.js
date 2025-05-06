const express = require("express");
const promotionController = require("../controllers/promotionController");
const { authorize } = require("../middlewares/authorize");
const ROLES = require("../../application/enums/roles");

const router = express.Router();

// Get all promotions
router.get("/", promotionController.getAllPromotions);

// Get promotion by ID
router.get("/:id", promotionController.getPromotionById);

// Get promotions for a product
router.get("/product/:productId", promotionController.getProductPromotions);

router.post(
  "/add",
  authorize({ roles: ROLES.ADMIN }),
  promotionController.createPromotion
);
router.put(
  "/:id/edit",
  authorize({ roles: ROLES.ADMIN }),
  promotionController.updatePromotion
);
router.delete(
  "/:id/delete",
  authorize({ roles: ROLES.ADMIN }),
  promotionController.deletePromotion
);

router.post(
  "/assign",
  authorize({ roles: ROLES.ADMIN }),
  promotionController.assignPromotion
);
router.delete(
  "/product/:productId/promotion/:promotionId",
  authorize({ roles: ROLES.ADMIN }),
  promotionController.removePromotion
);

module.exports = router;
