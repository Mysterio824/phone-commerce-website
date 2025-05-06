const brandService = require("../../application/services/brandService");
const CustomError = require("../../utils/cerror");
const { getAll } = require("./categoryController");
const { getDetail } = require("./userController");

const brandController = {
  getAll: async (req, res, next) => {
    try {
      const brands = await brandService.getAllBrands();
      res.status(200).json({
        success: true,
        message: "Brands retrieved successfully.",
        data: { brands },
      });
    } catch (error) {
      console.error("Error getting all brands:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to load brands.",
      });
    }
  },

  getDetail: async (req, res, next) => {
    try {
      const brandId = req.params.id;
      const brand = await brandService.getBrandById(brandId);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found." });
      }
      res.status(200).json({
        success: true,
        message: "Brand retrieved successfully.",
        data: { brand },
      });
    } catch (error) {
      console.error("Error getting brand detail:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to load brand details.",
      });
    }
  },

  addBrand: async (req, res, next) => {
    try {
      const { name, logoUrl, description } = req.body;
      if (!name || !categoryId) {
        return res
          .status(400)
          .json({ message: "Name and category ID are required." });
      }
      const newBrand = await brandService.addBrand(name, description, logoUrl);
      res.status(201).json({
        success: true,
        message: "Brand added successfully.",
        data: { brand: newBrand },
      });
    } catch (error) {
      console.error("Error adding brand:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to add brand.",
      });
    }
  },

  updateBrand: async (req, res, next) => {
    try {
      const brandId = req.params.id;
      const { name, logoUrl, description } = req.body;
      if (!name || !categoryId) {
        return res
          .status(400)
          .json({ message: "Name and category ID are required." });
      }
      const updatedBrand = await brandService.updateBrand(
        brandId,
        name,
        description,
        logoUrl
      );
      if (!updatedBrand) {
        return res.status(404).json({ message: "Brand not found." });
      }
      res.status(200).json({
        success: true,
        message: "Brand updated successfully.",
        data: { brand: updatedBrand },
      });
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update brand.",
      });
    }
  },

  deleteBrand: async (req, res, next) => {
    try {
      const brandId = req.params.id;
      const deletedBrand = await brandService.deleteBrand(brandId);
      if (!deletedBrand) {
        return res.status(404).json({ message: "Brand not found." });
      }
      res.status(200).json({
        success: true,
        message: "Brand deleted successfully.",
        data: { brand: deletedBrand },
      });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to delete brand.",
      });
    }
  },
};

module.exports = brandController;
