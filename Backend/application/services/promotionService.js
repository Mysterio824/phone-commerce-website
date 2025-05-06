const promotionModel = require("../../infrastructure/database/models/promotion.m");
const productPromotionModel = require("../../infrastructure/database/models/productPromotion.m");
const cacheService =
  require("../../infrastructure/external/cacheService").forDomain("promotion");

const CACHE_TTL = {
  PROMOTIONS: 300, // 5 minutes
  PRODUCT_PROMOTIONS: 300, // 5 minutes
};

const promotionService = {
  getAllPromotions: async () => {
    try {
      const cacheKey = "all_promotions";
      const cachedPromotions = await cacheService.get(cacheKey);

      if (cachedPromotions) {
        return cachedPromotions;
      }

      const promotions = await promotionModel.all();
      await cacheService.set(cacheKey, promotions, CACHE_TTL.PROMOTIONS);

      return promotions;
    } catch (error) {
      console.error("Error getting all promotions:", error);
      throw error;
    }
  },

  getPromotionById: async (id) => {
    try {
      const cacheKey = `promotion_${id}`;
      const cachedPromotion = await cacheService.get(cacheKey);

      if (cachedPromotion) {
        return cachedPromotion;
      }

      const promotion = await promotionModel.one(id);
      if (promotion) {
        await cacheService.set(cacheKey, promotion, CACHE_TTL.PROMOTIONS);
      }

      return promotion;
    } catch (error) {
      console.error(`Error getting promotion with ID ${id}:`, error);
      throw error;
    }
  },

  getActivePromotionsForProduct: async (productId) => {
    try {
      const cacheKey = `product_promotions_${productId}`;
      const cachedPromotions = await cacheService.get(cacheKey);

      if (cachedPromotions) {
        return cachedPromotions;
      }

      const productPromotions = await productPromotionModel.getByProductId(
        productId
      );

      const now = new Date();
      const activePromotions = [];

      for (const pp of productPromotions) {
        const promotion = await promotionModel.one(pp.promotionId);
        if (promotion) {
          const startDate = new Date(promotion.startDate);
          const endDate = new Date(promotion.endDate);

          if (now >= startDate && now <= endDate) {
            activePromotions.push(promotion);
          }
        }
      }

      await cacheService.set(
        cacheKey,
        activePromotions,
        CACHE_TTL.PRODUCT_PROMOTIONS
      );
      return activePromotions;
    } catch (error) {
      console.error(
        `Error getting promotions for product ${productId}:`,
        error
      );
      throw error;
    }
  },

  createPromotion: async (promotionData) => {
    try {
      const result = await promotionModel.add(promotionData);
      await invalidatePromotionsCache();
      return result;
    } catch (error) {
      console.error("Error creating promotion:", error);
      throw error;
    }
  },

  updatePromotion: async (promotionData) => {
    try {
      const result = await promotionModel.edit(promotionData);
      await invalidatePromotionsCache();
      await cacheService.del(`promotion_${promotionData.id}`);
      return result;
    } catch (error) {
      console.error(`Error updating promotion ${promotionData.id}:`, error);
      throw error;
    }
  },

  deletePromotion: async (id) => {
    try {
      const result = await promotionModel.delete(id);
      await invalidatePromotionsCache();
      await cacheService.del(`promotion_${id}`);
      return result;
    } catch (error) {
      console.error(`Error deleting promotion ${id}:`, error);
      throw error;
    }
  },

  assignPromotionToProduct: async (productId, promotionId) => {
    try {
      const promotion = await promotionModel.one(promotionId);
      if (!promotion) {
        throw new Error(`Promotion with ID ${promotionId} not found`);
      }

      const result = await productPromotionModel.add({
        productId,
        promotionId,
      });

      // Invalidate product promotions cache
      await cacheService.del(`product_promotions_${productId}`);

      return result;
    } catch (error) {
      console.error(
        `Error assigning promotion ${promotionId} to product ${productId}:`,
        error
      );
      throw error;
    }
  },

  removePromotionFromProduct: async (productId, promotionId) => {
    try {
      const result = await productPromotionModel.remove(productId, promotionId);

      await cacheService.del(`product_promotions_${productId}`);

      return result;
    } catch (error) {
      console.error(
        `Error removing promotion ${promotionId} from product ${productId}:`,
        error
      );
      throw error;
    }
  },
};

const invalidatePromotionsCache = async () => {
  try {
    await cacheService.delByPattern("all_promotions");
    await cacheService.delByPattern("product_promotions_*");
  } catch (error) {
    console.error("Error invalidating promotion caches:", error);
  }
};

module.exports = promotionService;
