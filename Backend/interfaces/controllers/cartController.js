const cartService = require("../../application/services/cartService");
const CustomError = require("../../utils/cerror");

const cartController = {
  getCartData: async (req, res, next) => {
    try {
      const uid = req.params.id;
      let { page, perPage } = req.query;

      const { formattedCart, totalPages } =
        await cartService.getFormattedCartData(uid, page, perPage);

      if (totalPages === 0 && page === 1) {
        return res.json({ page, totalPages, perPage, cart: formattedCart });
      }

      res
        .status(200)
        .json({ data: { cart: formattedCart, page, totalPages, perPage } });
    } catch (error) {
      console.error(error.message);
      next(new CustomError(500, "Failed to fetch cart data."));
    }
  },

  addProduct: async (req, res, next) => {
    try {
      const uid = req.params.id;

      const productId = parseInt(req.body.productId);
      const variantId = parseInt(req.body.variantId);
      const { quantity } = req.body;
      if (!productId || quantity < 1 || !variantId) {
        return res
          .status(400)
          .json({ message: "Invalid product or quantity." });
      }

      await cartService.addProductToCart(uid, productId, variantId, quantity);
      res
        .status(200)
        .json({
          message: "Product added to cart successfully.",
          data: { productId, quantity },
        });
    } catch (error) {
      console.error(error.message);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to add product to cart."));
    }
  },

  updateProduct: async (req, res, next) => {
    try {
      const uid = req.params.id;

      const productId = parseInt(req.body.productId);
      const variantId = parseInt(req.body.variantId);
      const { quantity } = req.body;
      if (!productId || quantity < 1 || !variantId) {
        return res
          .status(400)
          .json({ message: "Invalid product or quantity." });
      }

      const result = await cartService.updateCartItem(
        uid,
        productId,
        variantId,
        quantity
      );
      res
        .status(200)
        .json({
          message: "Product updated in cart successfully.",
          data: { result },
        });
    } catch (error) {
      console.error(error.message);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to update cart product."));
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      const uid = req.params.id;

      const productId = parseInt(req.body.productId);
      const variantId = parseInt(req.body.variantId);
      const { quantity } = req.body;
      if (!productId || quantity < 1 || !variantId) {
        return res
          .status(400)
          .json({ message: "Invalid product or quantity." });
      }

      const { totalPrice } = await cartService.removeProductFromCart(
        uid,
        productId,
        variantId
      );
      res
        .status(200)
        .json({
          message: "Product removed from cart successfully.",
          data: { totalPrice },
        });
    } catch (error) {
      console.error(error.message);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(new CustomError(500, "Failed to delete product from cart."));
    }
  },
};

module.exports = cartController;
