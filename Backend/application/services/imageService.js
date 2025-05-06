const imageModel = require("../../infrastructure/database/models/productImage.m");
const path = require("path");
const config = require("../../config");

const getBaseUrl = () => {
  const port = process.env.PORT || config?.port || 3000;
  return `http://localhost:${port}`;
};

const imageService = {
  saveImage: async (imageData) => {
    try {
      return await imageModel.add(imageData);
    } catch (error) {
      console.error("Error saving image metadata:", error);
      throw error;
    }
  },

  getImageById: async (imageId) => {
    try {
      return await imageModel.one(imageId);
    } catch (error) {
      console.error(`Error getting image with ID ${imageId}:`, error);
      throw error;
    }
  },

  getProductImages: async (productId) => {
    try {
      return await imageModel.some(productId);
    } catch (error) {
      console.error(`Error getting images for product ${productId}:`, error);
      throw error;
    }
  },

  generateImageUrl: (filename) => {
    return `${getBaseUrl()}/api/image/${filename}`;
  },

  getImageFilePath: (imagePath) => {
    // Remove any URL parts and get just the filename
    const filename = path.basename(imagePath);
    return path.join(process.cwd(), "public", "imgs", filename);
  },
};

module.exports = imageService;
