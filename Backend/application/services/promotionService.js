const promotionModel = require('../../infrastructure/database/models/promotion.m');
const productPromotionModel = require('../../infrastructure/database/models/productPromotion.m');
const cacheService = require('../../infrastructure/external/cacheService').forDomain('promotion');

const CACHE_TTL = {
    PROMOTIONS: 300, // 5 minutes
    PRODUCT_PROMOTIONS: 300 // 5 minutes
};

const promotionService = {
    /**
     * Get all promotions
     * @returns {Promise<Array>} List of all promotions
     */
    getAllPromotions: async () => {
        try {
            const cacheKey = 'all_promotions';
            const cachedPromotions = await cacheService.get(cacheKey);
            
            if (cachedPromotions) {
                return cachedPromotions;
            }
            
            const promotions = await promotionModel.all();
            await cacheService.set(cacheKey, promotions, CACHE_TTL.PROMOTIONS);
            
            return promotions;
        } catch (error) {
            console.error('Error getting all promotions:', error);
            throw error;
        }
    },
    
    /**
     * Get promotion by ID
     * @param {number} id - Promotion ID
     * @returns {Promise<Object>} Promotion details
     */
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
    
    /**
     * Get active promotions for a product
     * @param {number} productId - Product ID
     * @returns {Promise<Array>} List of active promotions for the product
     */
    getActivePromotionsForProduct: async (productId) => {
        try {
            const cacheKey = `product_promotions_${productId}`;
            const cachedPromotions = await cacheService.get(cacheKey);
            
            if (cachedPromotions) {
                return cachedPromotions;
            }
            
            // Get all promotions associated with this product
            const productPromotions = await productPromotionModel.getByProductId(productId);
            
            // Filter for active promotions only (current date is between start and end dates)
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
            
            await cacheService.set(cacheKey, activePromotions, CACHE_TTL.PRODUCT_PROMOTIONS);
            return activePromotions;
        } catch (error) {
            console.error(`Error getting promotions for product ${productId}:`, error);
            throw error;
        }
    },
    
    /**
     * Create a new promotion
     * @param {Object} promotionData - Promotion data
     * @returns {Promise<Object>} Created promotion
     */
    createPromotion: async (promotionData) => {
        try {
            const result = await promotionModel.add(promotionData);
            await invalidatePromotionsCache();
            return result;
        } catch (error) {
            console.error('Error creating promotion:', error);
            throw error;
        }
    },
    
    /**
     * Update an existing promotion
     * @param {Object} promotionData - Updated promotion data
     * @returns {Promise<Object>} Updated promotion
     */
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
    
    /**
     * Delete a promotion
     * @param {number} id - Promotion ID to delete
     * @returns {Promise<Object>} Delete result
     */
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
    
    /**
     * Assign a promotion to a product
     * @param {number} productId - Product ID
     * @param {number} promotionId - Promotion ID
     * @returns {Promise<Object>} Assignment result
     */
    assignPromotionToProduct: async (productId, promotionId) => {
        try {
            // Check if promotion exists
            const promotion = await promotionModel.one(promotionId);
            if (!promotion) {
                throw new Error(`Promotion with ID ${promotionId} not found`);
            }
            
            // Add the association
            const result = await productPromotionModel.add({
                productId,
                promotionId
            });
            
            // Invalidate product promotions cache
            await cacheService.del(`product_promotions_${productId}`);
            
            return result;
        } catch (error) {
            console.error(`Error assigning promotion ${promotionId} to product ${productId}:`, error);
            throw error;
        }
    },
    
    /**
     * Remove a promotion from a product
     * @param {number} productId - Product ID
     * @param {number} promotionId - Promotion ID
     * @returns {Promise<Object>} Removal result
     */
    removePromotionFromProduct: async (productId, promotionId) => {
        try {
            const result = await productPromotionModel.remove(productId, promotionId);
            
            // Invalidate product promotions cache
            await cacheService.del(`product_promotions_${productId}`);
            
            return result;
        } catch (error) {
            console.error(`Error removing promotion ${promotionId} from product ${productId}:`, error);
            throw error;
        }
    }
};

/**
 * Invalidate all promotion-related caches
 */
const invalidatePromotionsCache = async () => {
    try {
        await cacheService.delByPattern('all_promotions');
        await cacheService.delByPattern('product_promotions_*');
    } catch (error) {
        console.error('Error invalidating promotion caches:', error);
    }
};

module.exports = promotionService; 