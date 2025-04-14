const productsModel = require('../../infrastructure/database/models/product.m');
const categoryService = require('./categoryService');
const { client } = require('../../infrastructure/external/redisClient');

const CACHE_KEYS = {
    ALL_PRODUCTS: 'products:all',
    PRODUCT_DETAIL: 'product:detail:', // Append product ID
    RELATED_PRODUCTS: 'product:related:', // Append category ID
    CATEGORY_FINDER: 'category:finder:' // Append category ID
};
  
const CACHE_TTL = {
    PRODUCTS: 120, // 2 minutes
    PRODUCT_DETAIL: 300, // 5 minutes
    CATEGORY_FINDER: 600 // 10 minutes
};
  
async function findCategoryById(categories, catID) {
    try {
        // Check Redis cache first
        const cacheKey = `${CACHE_KEYS.CATEGORY_FINDER}${catID}`;
        const cachedResult = await client.get(cacheKey);
        
        if (cachedResult) {
            return JSON.parse(cachedResult);
        }
        
        // If not in cache, search through categories
        let foundCategory = null;
        
        function searchCategory(cats, id) {
            for (const category of cats) {
                if (category.id === id) {
                    return category;
                }
                
                if (category.children && category.children.length > 0) {
                    const found = searchCategory(category.children, id);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        }
        
        foundCategory = searchCategory(categories, catID);
        
        // Cache the result (even if null)
        await client.set(
            cacheKey,
            JSON.stringify(foundCategory),
            { EX: CACHE_TTL.CATEGORY_FINDER }
        );
        
        return foundCategory;
    } catch (error) {
        console.error('Error in findCategoryById:', error);
        
        // Fallback to direct search if Redis fails
        function searchCategory(cats, id) {
            for (const category of cats) {
                if (category.id === id) {
                    return category;
                }
                
                if (category.children && category.children.length > 0) {
                    const found = searchCategory(category.children, id);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        }
        
        return searchCategory(categories, catID);
    }
}

const productService = {
    getFilteredProducts: async (filters) => {
        const { page, per_page, min, max, sort, query, catID } = filters;
        let currentPage = page;

        // Get products from cache or database
        let products;
        try {
            const cachedProducts = await client.get(CACHE_KEYS.ALL_PRODUCTS);
            
            if (cachedProducts) {
                products = JSON.parse(cachedProducts);
            } else {
                products = await productsModel.all();
                
                // Cache the products
                await client.set(
                    CACHE_KEYS.ALL_PRODUCTS,
                    JSON.stringify(products),
                    { EX: CACHE_TTL.PRODUCTS }
                );
            }
        } catch (error) {
            console.error('Redis error in getFilteredProducts:', error);
            // Fallback to direct DB access
            products = await productsModel.all();
        }
        
        // Make a copy to avoid modifying cached data
        products = [...products];

        // Get category data
        const categories = await categoryService.buildCategoryHierarchy();
        const categoryMap = await categoryService.getCategoryMap();
        
        // Create searchable copy of the query (once, not per product)
        const lowerQuery = query.toLowerCase();
        
        // Filter by category
        if (catID !== 0) {
            const selectedCategory = await findCategoryById(categories, catID);
            if (!selectedCategory) {
                return { message: "Category not found" };
            }
            
            if (selectedCategory.children?.length > 0) {
                // Pre-build a Set of child category IDs for O(1) lookups
                const childCategoryIds = new Set();
                for (const child of selectedCategory.children) {
                    childCategoryIds.add(child.id);
                }
                
                products = products.filter(item => 
                    item.category_id && 
                    (item.category_id === catID || childCategoryIds.has(item.category_id))
                );
            } else {
                products = products.filter(item => item.category_id === catID);
            }
        }            

        // Filter by price and search query
        products = products.filter(item => {
            // First check price range since it's a quick numeric comparison
            if (item.price < min || item.price > max) {
                return false;
            }
            
            // Only perform string operations if price check passed
            const itemName = item.name.toLowerCase();
            if (itemName.includes(lowerQuery)) {
                return true;
            }
            
            // Only check category if needed
            if (item.category_id) {
                const category = categoryMap.get(item.category_id);
                if (category && category.name.toLowerCase().includes(lowerQuery)) {
                    return true;
                }
            }
            
            return false;
        });
        
        // Sort products
        const totalResults = products.length;
        
        if (sort === 'min') {
            products.sort((a, b) => a.price - b.price);
        } else if (sort === 'max') {
            products.sort((a, b) => b.price - a.price);
        }

        // Calculate pagination
        const total_pages = Math.ceil(totalResults / per_page);
        
        if (total_pages === 0 && currentPage === 1) {
            return { 
                page: currentPage, 
                total_pages, 
                per_page, 
                products: [], 
                category: categories, 
                catID,
                totalResults 
            };
        }
        
        if (currentPage > total_pages) currentPage = total_pages;
        
        // Get only the items needed for current page
        const startIdx = (currentPage - 1) * per_page;
        const endIdx = Math.min(startIdx + per_page, totalResults);
        const pagedProducts = products.slice(startIdx, endIdx);

        return { 
            category: categories, 
            products: pagedProducts, 
            page: currentPage, 
            total_pages, 
            catID,
            totalResults
        };
    },

    getProductDetail: async (productId) => {
        try {
            // Try to get product from cache
            const productCacheKey = `${CACHE_KEYS.PRODUCT_DETAIL}${productId}`;
            const cachedProduct = await client.get(productCacheKey);
            
            let product;
            if (cachedProduct) {
                product = JSON.parse(cachedProduct);
            } else {
                product = await productsModel.one('id', productId);
                
                if (product) {
                    // Cache the product
                    await client.set(
                        productCacheKey,
                        JSON.stringify(product),
                        { EX: CACHE_TTL.PRODUCT_DETAIL }
                    );
                } else {
                    return { product: null };
                }
            }
            
            // Try to get related products from cache
            const relatedCacheKey = `${CACHE_KEYS.RELATED_PRODUCTS}${product.category_id}`;
            const cachedRelated = await client.get(relatedCacheKey);
            
            let relativeProducts;
            if (cachedRelated) {
                relativeProducts = JSON.parse(cachedRelated);
            } else {
                relativeProducts = await productsModel.allWithCondition(
                    'category_id', 
                    product.category_id
                );
                
                // Cache the related products
                await client.set(
                    relatedCacheKey,
                    JSON.stringify(relativeProducts),
                    { EX: CACHE_TTL.PRODUCT_DETAIL }
                );
            }
            
            return { product, relativeProducts };
        } catch (error) {
            console.error('Redis error in getProductDetail:', error);
            
            // Fallback to direct database access
            const product = await productsModel.one('id', productId);
            
            if (!product) {
                return { product: null };
            }
            
            const relativeProducts = await productsModel.allWithCondition(
                'category_id', 
                product.category_id
            );
            
            return { product, relativeProducts };
        }
    },

    // Clear cached data when products are modified
    invalidateCache: async () => {
        try {
            // Get all keys matching products:* pattern
            const productKeys = await client.keys(`${CACHE_KEYS.ALL_PRODUCTS}*`);
            const detailKeys = await client.keys(`${CACHE_KEYS.PRODUCT_DETAIL}*`);
            const relatedKeys = await client.keys(`${CACHE_KEYS.RELATED_PRODUCTS}*`);
            
            // Delete all matched keys
            const allKeys = [...productKeys, ...detailKeys, ...relatedKeys];
            if (allKeys.length > 0) {
                await client.del(allKeys);
            }
        } catch (error) {
            console.error('Error invalidating product cache:', error);
        }
    },

    addProduct: async (productData) => {
        try {
            const result = await productsModel.add(productData);
            await module.exports.invalidateCache();
            return result;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    },

    updateProduct: async (productData) => {
        try {
            const result = await productsModel.edit(productData);
            await module.exports.invalidateCache();
            
            // Also invalidate specific product cache
            if (result && result.id) {
                await client.del(`${CACHE_KEYS.PRODUCT_DETAIL}${result.id}`);
                
                if (result.category_id) {
                    await client.del(`${CACHE_KEYS.RELATED_PRODUCTS}${result.category_id}`);
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    deleteProduct: async (productId) => {
        try {
            const product = await productsModel.one('id', productId);
            const result = await productsModel.delete(productId);
            
            await module.exports.invalidateCache();
            
            // Also invalidate specific product cache
            await client.del(`${CACHE_KEYS.PRODUCT_DETAIL}${productId}`);
            
            if (product && product.category_id) {
                await client.del(`${CACHE_KEYS.RELATED_PRODUCTS}${product.category_id}`);
            }
            
            return result;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
};

module.exports = productService;