const imageModel = require('../../infrastructure/database/models/productImage.m');
const reviewService = require('../services/reviewService');
const brandService = require('../services/brandService');
const variantService = require('../services/variantService');

const productUtils = {
    enrichProduct: async (product, options = { withVariants: true, withBrand: true }) => {
        if (!product) return null;

        // Get product rating
        const { average, count } = await reviewService.getRating(product.id) ?? { average: 0, count: 0 };
        product.rating = average;
        product.reviewCount = count;

        // Get product images
        const images = await imageModel.some(product.id) ?? [];
        product.images = images;

        // Get product variants if requested
        if (options.withVariants) {
            const variants = await variantService.getVariantsByProductId(product.id) ?? [];
            product.variants = variants;
        }

        // Get product brand if requested
        if (options.withBrand && product.brandId) {
            const brand = await brandService.getBrandById(product.brandId);
            product.brand = brand;
        }

        return product;
    },

    enrichProducts: async (products, options = { withVariants: true, withBrand: true }) => {
        if (!products || !products.length) return [];
        return Promise.all(products.map(product => productUtils.enrichProduct(product, options)));
    },
};

module.exports = productUtils;