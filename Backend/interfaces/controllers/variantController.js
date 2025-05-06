const variantService = require("../../application/services/variantService");
const productService = require("../../application/services/productService");

const variantController = {
  getProductVariants: async (req, res) => {
    try {
      const productId = req.params.productId;
      const variants = await variantService.getVariantsByProductId(productId);

      res.json({
        success: true,
        data: variants,
      });
    } catch (error) {
      console.error(
        `Error fetching variants for product ${req.params.productId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to fetch product variants",
        error: error.message,
      });
    }
  },
  
  getVariantById: async (req, res) => {
    try {
      const variantId = req.params.id;
      const variant = await variantService.getVariantById(variantId);

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Variant with ID ${variantId} not found`,
        });
      }

      res.json({
        success: true,
        data: variant,
      });
    } catch (error) {
      console.error(`Error fetching variant ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch variant",
        error: error.message,
      });
    }
  },

  createVariant: async (req, res) => {
    try {
      const { productId, color, size, price, stock, imageId } = req.body;

      // Validate required fields
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      // Check if product exists
      const product = await productService.getProductDetail(productId);
      if (!product || !product.product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`,
        });
      }

      const variantData = {
        productId,
        color: color || null,
        size: size || null,
        price: price || product.product.price, // Default to product price if not specified
        stock: stock !== undefined ? stock : 0,
        imageid: imageId || null,
      };

      const newVariant = await variantService.createVariant(variantData);

      res.status(201).json({
        success: true,
        message: "Variant created successfully",
        data: newVariant,
      });
    } catch (error) {
      console.error("Error creating variant:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create variant",
        error: error.message,
      });
    }
  },
  
  updateVariant: async (req, res) => {
    try {
      const variantId = req.params.id;
      const existingVariant = await variantService.getVariantById(variantId);

      if (!existingVariant) {
        return res.status(404).json({
          success: false,
          message: `Variant with ID ${variantId} not found`,
        });
      }

      const { color, size, price, stock, imageId } = req.body;

      const variantData = {
        id: variantId,
        productId: existingVariant.productId,
        color: color !== undefined ? color : existingVariant.color,
        size: size !== undefined ? size : existingVariant.size,
        price: price !== undefined ? price : existingVariant.price,
        stock: stock !== undefined ? stock : existingVariant.stock,
        imageid: imageId !== undefined ? imageId : existingVariant.imageid,
      };

      const updatedVariant = await variantService.updateVariant(variantData);

      res.json({
        success: true,
        message: "Variant updated successfully",
        data: updatedVariant,
      });
    } catch (error) {
      console.error(`Error updating variant ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Failed to update variant",
        error: error.message,
      });
    }
  },
  
  deleteVariant: async (req, res) => {
    try {
      const variantId = req.params.id;
      const existingVariant = await variantService.getVariantById(variantId);

      if (!existingVariant) {
        return res.status(404).json({
          success: false,
          message: `Variant with ID ${variantId} not found`,
        });
      }

      await variantService.deleteVariant(variantId);

      res.json({
        success: true,
        message: "Variant deleted successfully",
      });
    } catch (error) {
      console.error(`Error deleting variant ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Failed to delete variant",
        error: error.message,
      });
    }
  },
  
  updateVariantStock: async (req, res) => {
    try {
      const variantId = req.params.id;
      const { stock } = req.body;

      if (stock === undefined) {
        return res.status(400).json({
          success: false,
          message: "Stock value is required",
        });
      }

      const existingVariant = await variantService.getVariantById(variantId);

      if (!existingVariant) {
        return res.status(404).json({
          success: false,
          message: `Variant with ID ${variantId} not found`,
        });
      }

      const updatedVariant = await variantService.updateVariantStock(
        variantId,
        stock
      );

      res.json({
        success: true,
        message: "Variant stock updated successfully",
        data: updatedVariant,
      });
    } catch (error) {
      console.error(
        `Error updating stock for variant ${req.params.id}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to update variant stock",
        error: error.message,
      });
    }
  },
};

module.exports = variantController;
