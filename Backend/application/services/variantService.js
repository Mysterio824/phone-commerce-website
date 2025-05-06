const variantModel = require("../../infrastructure/database/models/productVariant.m");
const cacheService = require("../../infrastructure/external/cacheService").forDomain("variant");
const imageModel = require("../../infrastructure/database/models/productImage.m");
const productCacheService = require("../../infrastructure/external/cacheService").product;

const CACHE_TTL = {
  VARIANTS: 300, // 5 minutes
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
      console.error("Error in getVariantsByProductId:", error);
      return await variantModel.all(productId);
    }
  },

  getVariantById: async (id) => {
    try {
      const cacheKey = `variant:${id}`;
      const cachedVariant = await cacheService.get(cacheKey);

      if (cachedVariant) {
        return cachedVariant;
      }

      const variant = await variantModel.one(id);
      if (variant && variant.imageid) {
        const image = await imageModel.one(variant.imageid);
        variant.imageurl = image;
      }

      if (variant) {
        await cacheService.set(cacheKey, variant, CACHE_TTL.VARIANTS);
      }

      return variant;
    } catch (error) {
      console.error(`Error in getVariantById for id ${id}:`, error);
      const variant = await variantModel.one(id);
      if (variant && variant.imageid) {
        const image = await imageModel.one(variant.imageid);
        variant.imageurl = image;
      }
      return variant;
    }
  },

  createVariant: async (variantData) => {
    try {
      const newVariant = await variantModel.add(variantData);
      await this.invalidateProductVariantsCache(variantData.productId);
      return newVariant;
    } catch (error) {
      console.error("Error creating variant:", error);
      throw error;
    }
  },

  updateVariant: async (variantData) => {
    try {
      const updatedVariant = await variantModel.edit(variantData);
      await this.invalidateProductVariantsCache(variantData.productId);
      await cacheService.del(`variant:${variantData.id}`);
      return updatedVariant;
    } catch (error) {
      console.error(`Error updating variant ${variantData.id}:`, error);
      throw error;
    }
  },

  deleteVariant: async (id) => {
    try {
      // Get the variant to get its product ID
      const variant = await variantModel.one(id);
      if (!variant) {
        throw new Error(`Variant with ID ${id} not found`);
      }

      const result = await variantModel.delete(id);
      await this.invalidateProductVariantsCache(variant.productId);
      await cacheService.del(`variant:${id}`);
      return result;
    } catch (error) {
      console.error(`Error deleting variant ${id}:`, error);
      throw error;
    }
  },

  updateVariantStock: async (id, stock) => {
    try {
      const variant = await variantModel.one(id);
      if (!variant) {
        throw new Error(`Variant with ID ${id} not found`);
      }

      variant.stock = stock;
      const updatedVariant = await variantModel.edit(variant);

      await this.invalidateProductVariantsCache(variant.productId);
      await cacheService.del(`variant:${id}`);

      return updatedVariant;
    } catch (error) {
      console.error(`Error updating stock for variant ${id}:`, error);
      throw error;
    }
  },

  invalidateProductVariantsCache: async (productId) => {
    try {
      await cacheService.del(`product:${productId}`);
      await productCacheService.delByPattern(`*${productId}*`);
    } catch (error) {
      console.error("Error invalidating variant cache:", error);
    }
  },
};

module.exports = variantService;
