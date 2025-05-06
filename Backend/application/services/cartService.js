const cartItemModel = require("../../infrastructure/database/models/cartItem.m");
const productModel = require("../../infrastructure/database/models/product.m");
const variantModel = require("../../infrastructure/database/models/productVariant.m");
const CustomError = require("../../utils/cerror");
const { getPagination } = require("../../utils/paginationUtils");

const cartService = {
  getFormattedCartData: async (userId, page, perPage) => {
    page = parseInt(page) || 1;
    perPage = parseInt(perPage) || 5;

    const cartItems = await cartItemModel.some(userId, page, perPage);

    const formattedCart = {
      products: await Promise.all(
        cartItems.map(async (item) => {
          const productInfo = await productModel.one("id", item.productid);
          const variantInfo = await variantModel.one(item.variantid);
          return {
            product: {
              id: productInfo.id,
              price: productInfo.price,
              name: productInfo.name,
              image: productInfo.thumbUrl,
              stock: productInfo.stock,
              variantName: variantInfo.name,
              variantId: item.variantid
            },
            quantity: item.quantity,
            price: item.quantity * variantInfo.price,
          };
        })
      ),
      cartId: userId,
    };

    const totalPrice = formattedCart.products.reduce(
      (sum, item) => sum + item.price,
      0
    );
    formattedCart.totalPrice = totalPrice;

    const { currentPage, totalPages, startIdx, endIdx } = getPagination(
      page,
      perPage,
      formattedCart.products.length
    );

    // Paginate products
    formattedCart.products = formattedCart.products.slice(startIdx, endIdx);

    return { formattedCart, totalPages, currentPage };
  },

  addProductToCart: async (userId, productid, variantid, quantity) => {
    const cartItems = await cartItemModel.all(userId);

    const productInfo = await productModel.one("id", productid);
    if (!productInfo) {
      throw new CustomError(404, "Product not found");
    }

    const variantInfo = await variantModel.one(variantid);
    if (!variantInfo || variantInfo.productid !== productid) {
      throw new CustomError(404, "Variant not found");
    }

    let existItem = cartItems.find(
      (item) => item.productid === productid && item.variantid === variantid
    );

    if (existItem) {
      existItem.quantity += quantity;
    } else {
      existItem = { productid, variantid, quantity, cartId: userId };
    }

    if (existItem.quantity > productInfo.stock) {
      throw new CustomError(400, "Not enough stock available.");
    }

    if (existItem.id) {
      await cartItemModel.edit(existItem);
    } else {
      await cartItemModel.add(existItem);
    }

    return true;
  },

  updateCartItem: async (userId, productid, variantid, quantity) => {
    const cartItems = await cartItemModel.all(userId);
    const existItem = cartItems.find(
      (item) => item.productid === productid && item.variantid === variantid
    );

    if (!existItem) {
      throw new CustomError(400, "Product not found in cart.");
    }
    const previouseQuantity = existItem.quantity;
    const productInfo = await productModel.one("id", productid);

    if (quantity > productInfo.stock) {
      throw new CustomError(400, "Not enough stock available.");
    }

    // Update item
    existItem.quantity = quantity;
    await cartItemModel.edit(existItem);

    return {
      udpatedPrice: existItem.quantity * productInfo.price,
      udpatedQuantity: existItem.quantity,
      changeInPrice:
        (existItem.quantity - previouseQuantity) * productInfo.price,
    };
  },

  removeProductFromCart: async (userId, productid, variantid) => {
    const cartItems = await cartItemModel.all(userId);
    const existItem = cartItems.find(
      (item) => item.productid === productid && item.variantid === variantid
    );

    if (!existItem) {
      throw new CustomError(404, "Product not found in cart.");
    }
    const productInfo = await productModel.one("id", productid);
    const changeInPrice = existItem.quantity * productInfo.price;

    await cartItemModel.delete(existItem.id);

    return { changeInPrice };
  },
};

module.exports = cartService;
