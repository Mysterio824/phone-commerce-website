const brandModel = require("../../infrastructure/database/models/brand.m");
const cacheService =
  require("../../infrastructure/external/cacheService").brand;

const CACHE_TTL = {
  BRANDS: 300, // 5 minutes
  BRAND_DETAIL: 600, // 10 minutes
};

const brandService = {
  getAllBrands: async () => {
    try {
      const cachedBrands = await cacheService.get("all");

      if (cachedBrands) {
        return cachedBrands;
      }

      const brands = await brandModel.all();

      // Cache the brands
      await cacheService.set("all", brands, CACHE_TTL.BRANDS);

      return brands;
    } catch (error) {
      console.error("Error in getAllBrands:", error);
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

      const brand = await brandModel.one("id", brandId);

      if (brand) {
        await cacheService.set(cacheKey, brand, CACHE_TTL.BRAND_DETAIL);
      }

      return brand;
    } catch (error) {
      console.error("Error in getBrandById:", error);
      return await brandModel.one("id", brandId);
    }
  },

  addBrand: async (name, description, logoUrl) => {
    try {
      if (!name || !description) {
        throw new Error("Name and description are required");
      }

      const existingBrand = await brandModel.one("name", name);
      if (existingBrand) {
        throw new Error("Brand already exists");
      }

      const brandData = {
        name,
        description,
        logourl: logoUrl,
      };

      const newBrand = await brandModel.add(brandData);

      // Invalidate the cache for all brands
      await cacheService.del("all");

      return newBrand;
    } catch (error) {
      console.error("Error in addBrand:", error);
      throw error;
    }
  },

  updateBrand: async (brandId, name, description, logoUrl) => {
    try {
      if (!brandId || !name || !description) {
        throw new Error("Brand ID, name, and description are required");
      }

      const brand = await brandModel.one("id", brandId);
      if (!brand) {
        throw new Error("Brand not found");
      }

      const updatedBrandData = {
        id: brandId,
        name,
        description,
        logourl: logoUrl,
      };

      const updatedBrand = await brandModel.edit(updatedBrandData);

      // Invalidate the cache for the specific brand and all brands
      await cacheService.del(`detail:${brandId}`);
      await cacheService.del("all");

      return updatedBrand;
    } catch (error) {
      console.error("Error in updateBrand:", error);
      throw error;
    }
  },

  deleteBrand: async (brandId) => {
    try {
      if (!brandId) {
        throw new Error("Brand ID is required");
      }

      const brand = await brandModel.one("id", brandId);
      if (!brand) {
        throw new Error("Brand not found");
      }

      await brandModel.del(brandId);

      // Invalidate the cache for the specific brand and all brands
      await cacheService.del(`detail:${brandId}`);
      await cacheService.del("all");

      return true;
    } catch (error) {
      console.error("Error in deleteBrand:", error);
      throw error;
    }
  },

  invalidateCache: async () => {
    try {
      await cacheService.delByPattern("*");
    } catch (error) {
      console.error("Error invalidating brand cache:", error);
    }
  },
};

module.exports = brandService;
