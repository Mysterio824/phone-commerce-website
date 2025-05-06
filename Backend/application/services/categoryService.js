const categoryModel = require("../../infrastructure/database/models/category.m");
const cacheService =
  require("../../infrastructure/external/cacheService").category;
const { validateCategory } = require("../validators/categoryValidator");

const CACHE_KEYS = {
  HIERARCHY: "hierarchy",
  MAP: "map",
  LOWEST: "lowest",
  CATEGORY_FINDER: "category_finder:",
};

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

const CACHE_TTL = 300; // 5 minutes

const categoryService = {
  buildCategoryHierarchy: async () => {
    try {
      const cachedData = await cacheService.get(CACHE_KEYS.HIERARCHY);

      if (cachedData) {
        return cachedData;
      }

      const categories = await categoryModel.all();

      const categoryMap = new Map();
      const hierarchyCate = [];

      // Create nodes with children arrays
      for (const category of categories) {
        const node = { ...category, children: [] };
        categoryMap.set(category.id, node);
      }

      // Build the hierarchy
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

      await cacheService.set(CACHE_KEYS.HIERARCHY, hierarchyCate, CACHE_TTL);

      return hierarchyCate;
    } catch (error) {
      console.error("Error building category hierarchy:", error);

      // Fallback to direct database access
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
        console.error("Fallback error:", dbError);
        throw error;
      }
    }
  },

  getCategoryMap: async () => {
    try {
      const cachedData = await cacheService.get(CACHE_KEYS.MAP);

      if (cachedData) {
        const categoryMap = new Map();
        // Convert the cached array back to a Map
        for (const [key, value] of cachedData) {
          categoryMap.set(parseInt(key), value);
        }
        return categoryMap;
      }

      const categories = await categoryModel.all();
      const categoryMap = new Map();

      for (const category of categories) {
        categoryMap.set(category.id, category);
      }

      // Convert Map to array for caching
      await cacheService.set(CACHE_KEYS.MAP, [...categoryMap], CACHE_TTL);

      return categoryMap;
    } catch (error) {
      console.error("Error building category map:", error);

      // Fallback to direct database access
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
      const cachedData = await cacheService.get(CACHE_KEYS.LOWEST);

      if (cachedData) {
        return cachedData;
      }

      const categories = await categoryModel.all();
      const lowestCategories = categories.filter((item) => item.parent != null);

      await cacheService.set(CACHE_KEYS.LOWEST, lowestCategories, CACHE_TTL);

      return lowestCategories;
    } catch (error) {
      console.error("Error getting lowest categories:", error);

      // Fallback to direct database access
      const categories = await categoryModel.all();
      return categories.filter((item) => item.parent != null);
    }
  },

  getAllParentCategories: async () => {
    try {
      const categories = await categoryModel.all();
      const parentCategories = categories.filter(
        (category) => !category.parent
      );
      return parentCategories;
    } catch (error) {
      console.error("Error getting all parent categories:", error);
      throw error;
    }
  },

  getCategoryById: async (categoryId) => {
    try {
      const category = await categoryModel.one("id", categoryId);
      return category;
    } catch (error) {
      console.error(`Error getting category by ID ${categoryId}:`, error);
      return null;
    }
  },

  findCategoryById: async (catID) => {
    try {
      const cacheKey = `${CACHE_KEYS.CATEGORY_FINDER}${catID}`;
      const cachedResult = await cacheService.get(cacheKey);

      if (cachedResult) {
        return cachedResult;
      }

      const categories = await categoryService.buildCategoryHierarchy();
      let foundCategory = searchCategory(categories, catID);

      // Cache the result (even if null)
      await cacheService.set(
        cacheKey,
        foundCategory,
        CACHE_TTL.CATEGORY_FINDER
      );

      return foundCategory;
    } catch (error) {
      console.error("Error in findCategoryById:", error);
      return searchCategory(categories, catID);
    }
  },

  invalidateCache: async () => {
    try {
      await cacheService.delByPattern("*");
    } catch (error) {
      console.error("Error invalidating category cache:", error);
    }
  },

  addCategory: async (categoryData) => {
    try {
      // Validate category data
      const validation = validateCategory(categoryData);
      if (!validation.isValid) {
        throw new Error(
          `Invalid category data: ${validation.errors.join(", ")}`
        );
      }

      // Check if parent exists
      if (categoryData.parent) {
        const parentCategory = await categoryModel.one(
          "id",
          categoryData.parent
        );
        if (!parentCategory) {
          throw new Error("Parent category does not exist");
        }
      }

      const result = await categoryModel.add(categoryData);
      await categoryService.invalidateCache();
      return result;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  },

  updateCategory: async (categoryData) => {
    try {
      // Validate category data
      const validation = validateCategory(categoryData);
      if (!validation.isValid) {
        throw new Error(
          `Invalid category data: ${validation.errors.join(", ")}`
        );
      }

      // Check if category exists
      const existingCategory = await categoryModel.one("id", categoryData.id);
      if (!existingCategory) {
        throw new Error("Category does not exist");
      }

      // Check for circular references
      if (categoryData.parent) {
        // Can't set parent to itself
        if (categoryData.parent === categoryData.id) {
          throw new Error("Category cannot be its own parent");
        }

        // Check if parent exists
        const parentCategory = await categoryModel.one(
          "id",
          categoryData.parent
        );
        if (!parentCategory) {
          throw new Error("Parent category does not exist");
        }
      }

      const result = await categoryModel.edit(categoryData);
      await categoryService.invalidateCache();
      return result;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      // Check if category exists
      const existingCategory = await categoryModel.one("id", categoryId);
      if (!existingCategory) {
        throw new Error("Category does not exist");
      }

      // Check if category has children
      const categories = await categoryModel.all();
      const hasChildren = categories.some(
        (category) => category.parent === categoryId
      );
      if (hasChildren) {
        throw new Error(
          "Cannot delete category with children. Remove or reassign children first."
        );
      }

      const result = await categoryModel.delete(categoryId);
      await categoryService.invalidateCache();
      return result;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
};

module.exports = categoryService;
