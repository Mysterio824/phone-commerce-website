const couponService = require("../../application/services/couponService");
const CustomError = require("../../utils/cerror");

const couponController = {
  getAllCoupons: async (req, res, next) => {
    try {
      const coupons = await couponService.getAllCoupons();
      
      res.status(200).json({
        data: { coupons }
      });
    } catch (error) {
      console.error(error);
      next(new CustomError(500, "Failed to retrieve coupons"));
    }
  },
  
  getCouponById: async (req, res, next) => {
    try {
      const couponId = parseInt(req.params.id);
      
      if (!couponId) {
        return res.status(400).json({ message: "Invalid coupon ID" });
      }
      
      const coupon = await couponService.getCouponById(couponId);
      
      res.status(200).json({
        data: { coupon }
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to retrieve coupon"));
    }
  },
  
  createCoupon: async (req, res, next) => {
    try {
      const couponData = req.body;
      
      const newCoupon = await couponService.createCoupon(couponData);
      
      res.status(201).json({
        message: "Coupon created successfully",
        data: { coupon: newCoupon }
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to create coupon"));
    }
  },
  
  updateCoupon: async (req, res, next) => {
    try {
      const couponId = parseInt(req.params.id);
      const couponData = req.body;
      
      if (!couponId) {
        return res.status(400).json({ message: "Invalid coupon ID" });
      }
      
      const updatedCoupon = await couponService.updateCoupon(couponId, couponData);
      
      res.status(200).json({
        message: "Coupon updated successfully",
        data: { coupon: updatedCoupon }
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to update coupon"));
    }
  },
  
  deleteCoupon: async (req, res, next) => {
    try {
      const couponId = parseInt(req.params.id);
      
      if (!couponId) {
        return res.status(400).json({ message: "Invalid coupon ID" });
      }
      
      await couponService.deleteCoupon(couponId);
      
      res.status(200).json({
        message: "Coupon deleted successfully"
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to delete coupon"));
    }
  },
  
  validateCoupon: async (req, res, next) => {
    try {
      const { code, amount } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Coupon code is required" });
      }
      
      if (!amount || isNaN(amount)) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      const result = await couponService.applyCouponDiscount(code, parseFloat(amount));
      
      res.status(200).json({
        data: { 
          couponId: result.couponId,
          discountAmount: result.discountAmount,
          finalAmount: result.finalAmount
        }
      });
    } catch (error) {
      console.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to validate coupon"));
    }
  }
};

module.exports = couponController; 