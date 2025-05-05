const variantModel = require('../../infrastructure/database/models/productVariant.m');
const cacheService = require('../../infrastructure/external/cacheService').forDomain('variant');
const imageModel = require('../../infrastructure/database/models/productImage.m');

const CACHE_TTL = {
    VARIANTS: 300 // 5 minutes
};

const variantService = {
    getVariantsByProductId: async (productId) => {
        try {
            const cacheKey = `product:${productId}`;
            const cachedVariants = await cacheService.get(cacheKey);
            
            if (cachedVariants) {
                return cachedVariants;
            }
            
            const variants = await variantModel.all(productId);
            for (let i = 0; i < variants.length; i++) {
                const image = await imageModel.one(variants[i].imageid);
                variants[i].imageurl = image;
            }

            await cacheService.set(cacheKey, variants, CACHE_TTL.VARIANTS);
            
            return variants;
        } catch (error) {
            console.error('Error in getVariantsByProductId:', error);
            return await variantModel.all(productId);
        }
    },

    invalidateProductVariantsCache: async (productId) => {
        try {
            await cacheService.del(`product:${productId}`);
        } catch (error) {
            console.error('Error invalidating variant cache:', error);
        }
    }
};

module.exports = variantService;