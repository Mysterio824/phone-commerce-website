const productsModel = require('../../infrastructure/database/models/product.m');
const imageModel = require('../../infrastructure/database/models/productImage.m');
const categoryService = require('./categoryService');
const reviewService = require('./reviewService');
const brandService = require('./brandService');
const variantService = require('./variantService');
const cacheService = require('../../infrastructure/external/cacheService').product;
const productUtils = require('../utils/productUtils');
const { validateProduct } = require('../validators/productValidator');
const ProductFilterService = require('./productFilterService');

const CACHE_KEYS = {
    ALL_PRODUCTS: 'all',
    PRODUCT_DETAIL: 'detail:',
    RELATED_PRODUCTS: 'related:',
};

const filterService = new ProductFilterService(categoryService);

const CACHE_TTL = {
    PRODUCTS: 120, // 2 minutes
    PRODUCT_DETAIL: 300, // 5 minutes
    CATEGORY_FINDER: 600 // 10 minutes
};


const productService = {
    getAllProducts: async () => {
        try {
            const cachedProducts = await cacheService.get(CACHE_KEYS.ALL_PRODUCTS);

            if (cachedProducts) {
                return cachedProducts;
            }

            // Get all products from database
            const products = await productsModel.all();

            // Enrich products with additional data
            const enrichedProducts = await Promise.all(
                products.map(product => productUtils.enrichProduct(product))
            );

            // Cache the enriched products
            await cacheService.set(CACHE_KEYS.ALL_PRODUCTS, enrichedProducts, CACHE_TTL.PRODUCTS);

            return enrichedProducts;
        } catch (error) {
            console.error('Error in getAllProducts:', error);

            // Fallback to database if caching fails
            try {
                const products = await productsModel.all();
                return await Promise.all(products.map(product => productUtils.enrichProduct(product)));
            } catch (fallbackError) {
                console.error('Fallback error in getAllProducts:', fallbackError);
                return [];
            }
        }
    },

    getFilteredProducts: async (filters = {}) => {
        try {
            const products = await productService.getAllProducts();
            return await filterService.applyFilters(products, filters);
        } catch (error) {
            console.error('Error in getFilteredProducts:', error);
            return {
                message: "Error filtering products",
                products: [],
                page: 1,
                totalPages: 1,
                perPage: 10,
                totalResults: 0,
                error: error.message
            };
        }
    },

    getProductDetail: async (productId) => {
        try {
            const productCacheKey = `${CACHE_KEYS.PRODUCT_DETAIL}${productId}`;
            const cachedProduct = await cacheService.get(productCacheKey);

            let product;
            if (cachedProduct) {
                product = cachedProduct;
            } else {
                product = await productsModel.one('id', productId);

                if (!product) {
                    return { product: null };
                }

                // Enrich the product with additional data
                product = await productUtils.enrichProduct(product);

                await cacheService.set(productCacheKey, product, CACHE_TTL.PRODUCT_DETAIL);
            }

            // Get related products
            const relatedCacheKey = `${CACHE_KEYS.RELATED_PRODUCTS}${product.cateId}`;
            let relatedProducts;
            const cachedRelated = await cacheService.get(relatedCacheKey);

            if (cachedRelated) {
                relatedProducts = cachedRelated;
            } else {
                // Get related products by category
                const categoryProducts = await productsModel.some('cateId', product.cateId);

                // Exclude current product
                const filteredProducts = categoryProducts.filter(p => p.id !== parseInt(productId));

                // Enrich with ratings and images
                relatedProducts = await Promise.all(
                    filteredProducts.map(async (relatedProduct) => {
                        // Get product rating
                        const { average } = await reviewService.getRating(relatedProduct.id) ?? { average: 0 };
                        relatedProduct.rating = average;

                        // Get product images
                        const images = await imageModel.some(relatedProduct.id) ?? [];
                        relatedProduct.images = images;

                        return relatedProduct;
                    })
                );

                await cacheService.set(relatedCacheKey, relatedProducts, CACHE_TTL.PRODUCT_DETAIL);
            }

            return { product, relatedProducts };
        } catch (error) {
            console.error(`Error in getProductDetail for product ${productId}:`, error);

            // Fallback to direct database access
            try {
                const product = await productsModel.one('id', productId);
                if (!product) return { product: null };

                // Enrich the product
                const enrichedProduct = await productUtils.enrichProduct(product);

                // Get related products
                const categoryProducts = await productsModel.some('cateId', product.cateId);

                // Exclude current product and limit to 10 related items
                const relatedProducts = await Promise.all(
                    categoryProducts
                        .filter(p => p.id !== parseInt(productId))
                        .slice(0, 10)
                        .map(async (related) => {
                            const { average } = await reviewService.getRating(related.id) ?? { average: 0 };
                            related.rating = average;
                            const images = await imageModel.some(related.id) ?? [];
                            related.images = images;
                            return related;
                        })
                );

                return { product: enrichedProduct, relatedProducts };
            } catch (fallbackError) {
                console.error(`Fallback error in getProductDetail for product ${productId}:`, fallbackError);
                return { product: null, error: error.message };
            }
        }
    },

    invalidateCache: async () => {
        try {
            await cacheService.delByPattern('*');
        } catch (error) {
            console.error('Error invalidating product cache:', error);
        }
    },

    addProduct: async (productData) => {
        try {
            // Validate product data
            const validation = validateProduct(productData);
            if (!validation.Valid) {
                throw new Error(`Invalid product data: ${validation.errors.join(', ')}`);
            }

            // Check if category exists if provided
            if (productData.cateId) {
                const category = await categoryService.getCategoryById(productData.cateId);
                if (!category) {
                    throw new Error('Category does not exist');
                }
            }

            // Check if brand exists if provided
            if (productData.brandId) {
                const brand = await brandService.getBrandById(productData.brandId);
                if (!brand) {
                    throw new Error('Brand does not exist');
                }
            }

            const result = await productsModel.add(productData);
            await productService.invalidateCache();
            return result;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    },

    updateProduct: async (productData) => {
        try {
            // Check if product exists
            const existingProduct = await productsModel.one('id', productData.id);
            if (!existingProduct) {
                throw new Error('Product does not exist');
            }

            // Validate product data
            const validation = validateProduct(productData);
            if (!validation.Valid) {
                throw new Error(`Invalid product data: ${validation.errors.join(', ')}`);
            }

            // Check if category exists if provided
            if (productData.cateId) {
                const category = await categoryService.getCategoryById(productData.cateId);
                if (!category) {
                    throw new Error('Category does not exist');
                }
            }

            // Check if brand exists if provided
            if (productData.brandId) {
                const brand = await brandService.getBrandById(productData.brandId);
                if (!brand) {
                    throw new Error('Brand does not exist');
                }
            }

            const result = await productsModel.edit(productData);
            await productService.invalidateCache();

            return result;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    deleteProduct: async (productId) => {
        try {
            // Check if product exists
            const product = await productsModel.one('id', productId);
            if (!product) {
                throw new Error('Product does not exist');
            }

            const result = await productsModel.delete(productId);

            await productService.invalidateCache();

            // Invalidate variant cache
            await variantService.invalidateProductVariantsCache(productId);

            return result;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
};

module.exports = productService;