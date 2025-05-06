const promotionService = require("../../application/services/promotionService");

const promotionController = {
  getAllPromotions: async (req, res) => {
    try {
      const promotions = await promotionService.getAllPromotions();
      res.json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch promotions",
        error: error.message,
      });
    }
  },
  
  getPromotionById: async (req, res) => {
    try {
      const promotionId = req.params.id;
      const promotion = await promotionService.getPromotionById(promotionId);

      if (!promotion) {
        return res.status(404).json({
          success: false,
          message: `Promotion with ID ${promotionId} not found`,
        });
      }

      res.json({
        success: true,
        data: promotion,
      });
    } catch (error) {
      console.error(`Error fetching promotion ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch promotion",
        error: error.message,
      });
    }
  },

  createPromotion: async (req, res) => {
    try {
      const promotionData = {
        name: req.body.name,
        description: req.body.description,
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        isActive: req.body.isActive || true,
      };

      const newPromotion = await promotionService.createPromotion(
        promotionData
      );

      res.status(201).json({
        success: true,
        message: "Promotion created successfully",
        data: newPromotion,
      });
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create promotion",
        error: error.message,
      });
    }
  },

  updatePromotion: async (req, res) => {
    try {
      const promotionId = req.params.id;
      const existingPromotion = await promotionService.getPromotionById(
        promotionId
      );

      if (!existingPromotion) {
        return res.status(404).json({
          success: false,
          message: `Promotion with ID ${promotionId} not found`,
        });
      }

      const promotionData = {
        id: promotionId,
        name: req.body.name,
        description: req.body.description,
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        isActive: req.body.isActive,
      };

      const updatedPromotion = await promotionService.updatePromotion(
        promotionData
      );

      res.json({
        success: true,
        message: "Promotion updated successfully",
        data: updatedPromotion,
      });
    } catch (error) {
      console.error(`Error updating promotion ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Failed to update promotion",
        error: error.message,
      });
    }
  },

  deletePromotion: async (req, res) => {
    try {
      const promotionId = req.params.id;
      const existingPromotion = await promotionService.getPromotionById(
        promotionId
      );

      if (!existingPromotion) {
        return res.status(404).json({
          success: false,
          message: `Promotion with ID ${promotionId} not found`,
        });
      }

      await promotionService.deletePromotion(promotionId);

      res.json({
        success: true,
        message: "Promotion deleted successfully",
      });
    } catch (error) {
      console.error(`Error deleting promotion ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Failed to delete promotion",
        error: error.message,
      });
    }
  },

  getProductPromotions: async (req, res) => {
    try {
      const productId = req.params.productId;
      const promotions = await promotionService.getActivePromotionsForProduct(
        productId
      );

      res.json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      console.error(
        `Error fetching promotions for product ${req.params.productId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to fetch product promotions",
        error: error.message,
      });
    }
  },

  assignPromotion: async (req, res) => {
    try {
      const { productId, promotionId } = req.body;

      if (!productId || !promotionId) {
        return res.status(400).json({
          success: false,
          message: "Product ID and Promotion ID are required",
        });
      }

      const result = await promotionService.assignPromotionToProduct(
        productId,
        promotionId
      );

      res.status(201).json({
        success: true,
        message: "Promotion assigned to product successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error assigning promotion to product:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign promotion to product",
        error: error.message,
      });
    }
  },
  
  removePromotion: async (req, res) => {
    try {
      const { productId, promotionId } = req.params;

      const result = await promotionService.removePromotionFromProduct(
        productId,
        promotionId
      );

      res.json({
        success: true,
        message: "Promotion removed from product successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error removing promotion from product:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove promotion from product",
        error: error.message,
      });
    }
  },
};

module.exports = promotionController;
