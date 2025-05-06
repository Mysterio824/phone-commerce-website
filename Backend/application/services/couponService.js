const couponModel = require("../../infrastructure/database/models/coupon.m");
const CustomError = require("../../utils/cerror");

const couponService = {
  getAllCoupons: async () => {
    const coupons = await couponModel.all();
    return coupons;
  },
  
  getCouponById: async (id) => {
    const coupon = await couponModel.one(id);
    if (!coupon) {
      throw new CustomError(404, "Coupon not found");
    }
    return coupon;
  },
  
  getCouponByCode: async (code) => {
    const coupon = await couponModel.getByCode(code);
    if (!coupon) {
      throw new CustomError(404, `Coupon with code ${code} not found`);
    }
    return coupon;
  },
  
  createCoupon: async (couponData) => {
    // Validate coupon data
    if (!couponData.code) {
      throw new CustomError(400, "Coupon code is required");
    }
    
    if (!couponData.discountType || !["percentage", "fixed_amount"].includes(couponData.discountType)) {
      throw new CustomError(400, "Valid discount type is required (percentage or fixed_amount)");
    }
    
    if (typeof couponData.discountValue !== 'number' || couponData.discountValue <= 0) {
      throw new CustomError(400, "Valid discount value is required");
    }
    
    if (!couponData.startDate || !couponData.endDate) {
      throw new CustomError(400, "Start and end dates are required");
    }
    
    // Check if code already exists
    try {
      const existingCoupon = await couponModel.getByCode(couponData.code);
      if (existingCoupon) {
        throw new CustomError(400, "Coupon code already exists");
      }
    } catch (error) {
      // If error is not 404, rethrow it
      if (!(error instanceof CustomError && error.statusCode === 404)) {
        throw error;
      }
    }
    
    // Set default values
    const coupon = {
      code: couponData.code,
      discounttype: couponData.discountType,
      discountvalue: couponData.discountValue,
      minpurchase: couponData.minPurchase || 0,
      startdate: couponData.startDate,
      enddate: couponData.endDate,
      maxuses: couponData.maxUses || null,
      usescount: 0,
      active: couponData.active !== undefined ? couponData.active : true
    };
    
    return await couponModel.add(coupon);
  },
  
  updateCoupon: async (id, couponData) => {
    const coupon = await couponModel.one(id);
    if (!coupon) {
      throw new CustomError(404, "Coupon not found");
    }
    
    // If code is being changed, check if new code already exists
    if (couponData.code && couponData.code !== coupon.code) {
      try {
        const existingCoupon = await couponModel.getByCode(couponData.code);
        if (existingCoupon && existingCoupon.id !== id) {
          throw new CustomError(400, "Coupon code already exists");
        }
      } catch (error) {
        // If error is not 404, rethrow it
        if (!(error instanceof CustomError && error.statusCode === 404)) {
          throw error;
        }
      }
    }
    
    // Update coupon fields
    const updatedCoupon = {
      ...coupon,
      ...couponData,
      id: coupon.id // Ensure ID doesn't change
    };
    
    return await couponModel.edit(updatedCoupon);
  },
  
  deleteCoupon: async (id) => {
    const coupon = await couponModel.one(id);
    if (!coupon) {
      throw new CustomError(404, "Coupon not found");
    }
    
    return await couponModel.delete(id);
  },
  
  validateCoupon: async (code, totalAmount) => {
    const coupon = await couponModel.getByCode(code);
    
    if (!coupon) {
      throw new CustomError(404, "Coupon not found");
    }
    
    const now = new Date();
    
    // Check if coupon is active
    if (!coupon.active) {
      throw new CustomError(400, "Coupon is not active");
    }
    
    // Check if coupon is expired
    if (new Date(coupon.endDate) < now) {
      throw new CustomError(400, "Coupon has expired");
    }
    
    // Check if coupon is not yet valid
    if (new Date(coupon.startDate) > now) {
      throw new CustomError(400, "Coupon is not yet valid");
    }
    
    // Check if minimum purchase requirement is met
    if (coupon.minPurchase > totalAmount) {
      throw new CustomError(400, `Minimum purchase amount of ${coupon.minPurchase} not met`);
    }
    
    // Check if maximum uses is reached
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      throw new CustomError(400, "Coupon has reached maximum usage limit");
    }
    
    return coupon;
  },
  
  applyCouponDiscount: async (code, totalAmount) => {
    const coupon = await couponService.validateCoupon(code, totalAmount);
    
    let discountAmount = 0;
    
    if (coupon.discountType === 'percentage') {
      discountAmount = (totalAmount * coupon.discountValue) / 100;
    } else { // fixed_amount
      discountAmount = Math.min(coupon.discountValue, totalAmount);
    }
    
    return {
      couponId: coupon.id,
      discountAmount: discountAmount,
      finalAmount: totalAmount - discountAmount
    };
  }
};

module.exports = couponService; 