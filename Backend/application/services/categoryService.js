const categoryModel = require('../../infrastructure/database/models/category.m');
const { client } = require('../../infrastructure/external/redisClient');

const CACHE_KEYS = {
    HIERARCHY: 'category:hierarchy',
    MAP: 'category:map',
    LOWEST: 'category:lowest'
  };
  
const CACHE_TTL = 300;

const categoryService =  { 
    buildCategoryHierarchy: async () => {
        try {
            // Try to get data from Redis first
            const cachedData = await client.get(CACHE_KEYS.HIERARCHY);
            
            if (cachedData) {
                return JSON.parse(cachedData);
            }

            // If not in cache, fetch from database
            const categories = await categoryModel.all();
            
            // Use Map for efficient lookups
            const categoryMap = new Map();
            const hierarchyCate = [];
            
            // First pass: create nodes
            for (const category of categories) {
                const node = { ...category, children: [] };
                categoryMap.set(category.id, node);
            }
            
            // Second pass: build hierarchy
            for (const category of categories) {
                const node = categoryMap.get(category.id);
                if (category.parent) {
                    const parentCategory = categoryMap.get(category.parent);
                    if (parentCategory) {
                        parentCategory.children.push(node);
                    } else {
                        console.warn(`Parent not found for category: ${category.name}`);
                    }
                } else {
                    hierarchyCate.push(node);
                }
            }
            
            // Store in Redis cache
            await client.set(
                CACHE_KEYS.HIERARCHY, 
                JSON.stringify(hierarchyCate), 
                { EX: CACHE_TTL }
            );
            
            return hierarchyCate;
        } catch (error) {
            console.error('Error building category hierarchy:', error);
            
            try {
                const categories = await categoryModel.all();
                const categoryMap = new Map();
                const hierarchyCate = [];
                
                for (const category of categories) {
                    const node = { ...category, children: [] };
                    categoryMap.set(category.id, node);
                }
                
                for (const category of categories) {
                    const node = categoryMap.get(category.id);
                    if (category.parent) {
                        const parentCategory = categoryMap.get(category.parent);
                        if (parentCategory) {
                            parentCategory.children.push(node);
                        }
                    } else {
                        hierarchyCate.push(node);
                    }
                }
                
                return hierarchyCate;
            } catch (dbError) {
                console.error('Fallback error:', dbError);
                throw error; // Throw original error if fallback also fails
            }
        }
    },

    getCategoryMap: async () => {
        try {
            // Try to get data from Redis first
            const cachedData = await client.get(CACHE_KEYS.MAP);
            
            if (cachedData) {
                // Convert JSON map back to Map object
                const parsedData = JSON.parse(cachedData);
                const categoryMap = new Map();
                for (const [key, value] of parsedData) {
                    categoryMap.set(parseInt(key), value);
                }
                return categoryMap;
            }

            // If not in cache, fetch from database
            const categories = await categoryModel.all();
            const categoryMap = new Map();
            
            for (const category of categories) {
                categoryMap.set(category.id, category);
            }
            
            // Store in Redis cache (convert Map to array for JSON serialization)
            await client.set(
                CACHE_KEYS.MAP, 
                JSON.stringify([...categoryMap]), 
                { EX: CACHE_TTL }
            );
            
            return categoryMap;
        } catch (error) {
            console.error('Error building category map:', error);
            
            // Fallback to direct DB if Redis fails
            const categories = await categoryModel.all();
            const categoryMap = new Map();
            for (const category of categories) {
                categoryMap.set(category.id, category);
            }
            return categoryMap;
        }
    },

    getLowestCategories: async () => {
        try {
            // Try to get data from Redis first
            const cachedData = await client.get(CACHE_KEYS.LOWEST);
            
            if (cachedData) {
                return JSON.parse(cachedData);
            }

            // If not in cache, fetch from database
            const lowestCategories = await categoryModel.allLowest();
            
            // Store in Redis cache
            await client.set(
                CACHE_KEYS.LOWEST, 
                JSON.stringify(lowestCategories), 
                { EX: CACHE_TTL }
            );
            
            return lowestCategories;
        } catch (error) {
            console.error('Error getting lowest categories:', error);
            
            // Fallback to direct DB if Redis fails
            return await categoryModel.allLowest();
        }
    },

    invalidateCache: async () => {
        try {
            await client.del(CACHE_KEYS.HIERARCHY);
            await client.del(CACHE_KEYS.MAP);
            await client.del(CACHE_KEYS.LOWEST);
        } catch (error) {
            console.error('Error invalidating cache:', error);
        }
    },

    addCategory: async (categoryData) => {
        try {
            const result = await categoryModel.add(categoryData);
            // Invalidate cache after adding
            await module.exports.invalidateCache();
            return result;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    },

    updateCategory: async (categoryData) => {
        try {
            const result = await categoryModel.edit(categoryData);
            // Invalidate cache after updating
            await module.exports.invalidateCache();
            return result;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    deleteCategory: async (categoryId) => {
        try {
            const result = await categoryModel.delete('id', categoryId);
            // Invalidate cache after deleting
            await module.exports.invalidateCache();
            return result;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
};

module.exports = categoryService;