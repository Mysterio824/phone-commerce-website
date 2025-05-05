const cartItemModel = require('../../infrastructure/database/models/cartItem.m');
const productModel = require('../../infrastructure/database/models/product.m');
const CustomError = require('../../utils/cerror');
const { getPagination } = require('../utils/paginationUtils');

const cartService = {
    getFormattedCartData: async (userId, page, perPage) => {
        const cartItems = await cartItemModel.some(userId, page, perPage);

        const formattedCart = {
            products: await Promise.all(cartItems.map(async (item) => {
                const productInfo = await productModel.one('id', item.productId);
                return {
                    product: { 
                        id: productInfo.id, 
                        price: productInfo.price, 
                        name: productInfo.name, 
                        image: productInfo.thumbUrl, 
                        stock: productInfo.stock 
                    },
                    quantity: item.quantity,
                    price: item.quantity * productInfo.price,
                };
            })),
            userId
        };
        
        const totalPrice = formattedCart.products.reduce((sum, item) => sum + item.price, 0);
        formattedCart.totalPrice = totalPrice;

        const { currentPage, totalPages, startIdx, endIdx } = getPagination(page, perPage, formattedCart.products.length);
        
        // Paginate products
        formattedCart.products = formattedCart.products.slice(startIdx, endIdx);
        
        return { formattedCart, totalPages, currentPage };
    },

    addProductToCart: async (userId, productId, quantity) => {
        const cartItems = await cartItemModel.all(userId);
        const productInfo = await productModel.one('id', productId);
        
        if (!productInfo) {
            throw new CustomError(404, 'Product not found');
        }
        
        let existItem = cartItems.find(item => item.productId === productId);
        
        if (existItem) {
            existItem.quantity += quantity;
        } else {
            existItem = { productId, quantity, userId };
        }
        
        if (existItem.quantity > productInfo.stock) {
            throw new CustomError(400, 'Not enough stock available.');
        }
        
        if (existItem.id) {
            await cartItemModel.edit(existItem);
        } else {
            await cartItemModel.add(existItem);
        }
        
        return true;
    },    

    updateCartItem: async (userId, productId, quantity) => {         
        const cartItems = await cartItemModel.all(userId);
        const existItem = cartItems.find(item => item.productId === productId);
        
        if (!existItem) {
            throw new CustomError(400, 'Product not found in cart.');
        }
        const previouseQuantity = existItem.quantity;
        const productInfo = await productModel.one('id', productId);
        
        if (quantity > productInfo.stock) {
            throw new CustomError(400, 'Not enough stock available.');
        }
        
        // Update item
        existItem.quantity = quantity;
        await cartItemModel.edit(existItem);
        
        return { 
            udpatedPrice: existItem.quantity * productInfo.price, 
            udpatedQuantity: existItem.quantity, 
            changeInPrice: (existItem.quantity - previouseQuantity) * productInfo.price 
        };
    },

    removeProductFromCart: async (userId, productId) => {
        const cartItems = await cartItemModel.all(userId);
        const existItem = cartItems.find(item => item.productId === productId);
        
        if (!existItem) {
            throw new CustomError(404, 'Product not found in cart.');
        }
        const productInfo = await productModel.one('id', productId);
        const changeInPrice = existItem.quantity * productInfo.price;
        
        await cartItemModel.delete(existItem.id);
        
        return { changeInPrice };
    }
};

module.exports = cartService;