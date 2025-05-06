const couponController = require("../controllers/couponController");
const { authorize } = require("../middlewares/authorize");

const router = require("express").Router();

// Get all coupons (admin only)
router.get(
  "/",
  authorize({
    policy: "AdminOnly"
  }),
  couponController.getAllCoupons
);

// Get specific coupon by ID (admin only)
router.get(
  "/:id",
  authorize({
    policy: "AdminOnly"
  }),
  couponController.getCouponById
);

// Create new coupon (admin only)
router.post(
  "/add",
  authorize({
    policy: "AdminOnly"
  }),
  couponController.createCoupon
);

// Update coupon (admin only)
router.put(
  "/:id",
  authorize({
    policy: "AdminOnly"
  }),
  couponController.updateCoupon
);

// Delete coupon (admin only)
router.delete(
  "/:id",
  authorize({
    policy: "AdminOnly"
  }),
  couponController.deleteCoupon
);

// Validate coupon (available to all authenticated users)
router.post(
  "/validate",
  couponController.validateCoupon
);

module.exports = router; 