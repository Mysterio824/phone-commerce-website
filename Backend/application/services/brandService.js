const brandModel = require('../../infrastructure/database/models/brand.m');
const cacheService = require('../../infrastructure/external/cacheService').brand;

const CACHE_TTL = {
    BRANDS: 300, // 5 minutes
    BRAND_DETAIL: 600 // 10 minutes
};

const brandService = {
    getAllBrands: async () => {
        try {
            const cachedBrands = await cacheService.get('all');
            
            if (cachedBrands) {
                return cachedBrands;
            }
            
            const brands = await brandModel.all();
            
            // Cache the brands
            await cacheService.set('all', brands, CACHE_TTL.BRANDS);
            
            return brands;
        } catch (error) {
            console.error('Error in getAllBrands:', error);
            return await brandModel.all();
        }
    },

    getBrandById: async (brandId) => {
        try {
            const cacheKey = `detail:${brandId}`;
            const cachedBrand = await cacheService.get(cacheKey);
            
            if (cachedBrand) {
                return cachedBrand;
            }
            
            const brand = await brandModel.one('id', brandId);
            
            if (brand) {
                await cacheService.set(cacheKey, brand, CACHE_TTL.BRAND_DETAIL);
            }
            
            return brand;
        } catch (error) {
            console.error('Error in getBrandById:', error);
            return await brandModel.one('id', brandId);
        }
    },

    invalidateCache: async () => {
        try {
            await cacheService.delByPattern('*');
        } catch (error) {
            console.error('Error invalidating brand cache:', error);
        }
    }
};

module.exports = brandService;