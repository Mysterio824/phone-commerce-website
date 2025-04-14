const cartItemModel = require('../../infrastructure/database/models/cart_item.m');
const cartModel = require('../../infrastructure/database/models/cart.m');
const productModel = require('../../infrastructure/database/models/product.m');
const userModel = require('../../infrastructure/database/models/user.m');
const CustomError = require('../../utils/cerror');

const cartService = {
    getOrCreateCart: async (userId) => {
        let cart = await cartModel.one('user_id', userId);
        
        if (!cart) {
            const existUser = await userModel.one('id', userId);
            if (!existUser) {
                throw new CustomError(404, 'User not found');
            }
            cart = await cartModel.add({ user_id: existUser.id });
        }
        
        return cart;
    },

    getFormattedCartData: async (userId, page, per_page) => {
        let cart = await module.exports.getOrCreateCart(userId);
        
        const cartItems = await cartItemModel.allWithCondition('cart_id', cart.user_id);
        const totalPrice = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

        const formattedCart = {
            products: await Promise.all(cartItems.map(async (item) => {
                const productInfo = await cartItemModel.oneWithProductInfo('id', item.id);
                return {
                    product: { 
                        id: productInfo.product_id, 
                        price: productInfo.price, 
                        name: productInfo.name, 
                        image: productInfo.image, 
                        stock: productInfo.stock 
                    },
                    quantity: item.quantity,
                    price: item.quantity * productInfo.price,
                };
            })),
            total_price: totalPrice,
            user_id: cart.user_id,
        };

        const total_pages = Math.ceil(formattedCart.products.length / per_page);
        
        if (page > total_pages && total_pages > 0) {
            page = total_pages;
        }
        
        // Paginate products
        formattedCart.products = formattedCart.products.slice(
            (page - 1) * per_page, 
            Math.min(page * per_page, formattedCart.products.length)
        );
        
        return { formattedCart, total_pages, page };
    },

    addProductToCart: async (userId, productId, quantity) => {
        let cart = await module.exports.getOrCreateCart(userId);
        
        const cartItems = await cartItemModel.allWithCondition('cart_id', userId);
        const productInfo = await productModel.one('id', productId);
        
        if (!productInfo) {
            throw new CustomError(404, 'Product not found');
        }
        
        let existItem = cartItems.filter(item => item.product_id === productId)[0];
        
        if (existItem) {
            // Update existing item
            existItem.quantity += quantity;
            
            if (existItem.quantity > productInfo.stock) {
                throw new CustomError(400, 'Not enough stock available.');
            }
            
            await cartItemModel.edit(existItem);
            await cartModel.edit({ 
                user_id: cart.user_id, 
                total_price: cart.total_price + quantity * productInfo.price 
            });
            
            return true;
        }
        
        // Add new item
        existItem = { 
            product_id: productId, 
            quantity, 
            cart_id: userId 
        };
        
        if (existItem.quantity > productInfo.stock) {
            throw new CustomError(400, 'Not enough stock available.');
        }
        
        existItem.price = parseInt(productInfo.price) * existItem.quantity;
        await cartItemModel.add(existItem);
        
        const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0) + existItem.price;
        await cartModel.edit({ 
            user_id: cart.user_id, 
            total_price: totalPrice 
        });
        
        return true;
    },

    updateCartItem: async (userId, productId, quantity) => {
        const cart = await cartModel.one('user_id', userId);
        
        if (!cart) {
            throw new CustomError(404, 'Cart not found');
        }
        
        const cartItems = await cartItemModel.allWithCondition('cart_id', userId);
        const existItem = cartItems.filter(item => item.product_id === productId)[0];
        
        if (!existItem) {
            throw new CustomError(400, 'Product not found in cart.');
        }
        
        let totalPriceChange = -existItem.price;
        const productInfo = await productModel.one('id', productId);
        
        if (quantity > productInfo.stock) {
            throw new CustomError(400, 'Not enough stock available.');
        }
        
        // Update item
        existItem.quantity = quantity;
        existItem.price = quantity * productInfo.price;
        await cartItemModel.edit(existItem);
        
        // Recalculate total
        const updatedCartItems = await cartItemModel.allWithCondition('cart_id', userId);
        const totalPrice = updatedCartItems.reduce((sum, item) => sum + item.price, 0);
        
        await cartModel.edit({ 
            user_id: cart.user_id, 
            total_price: totalPrice 
        });
        
        return { 
            udpatedPrice: existItem.price, 
            udpatedQuantity: existItem.quantity, 
            totalPrice 
        };
    },

    removeProductFromCart: async (userId, productId) => {
        const cart = await cartModel.one('user_id', userId);
        
        if (!cart) {
            throw new CustomError(404, 'Cart not found.');
        }
        
        const cartItems = await cartItemModel.allWithCondition('cart_id', userId);
        const existItem = cartItems.filter(item => item.product_id === productId)[0];
        
        if (!existItem) {
            throw new CustomError(404, 'Product not found in cart.');
        }
        
        await cartItemModel.delete('id', existItem.id);
        
        // Recalculate total price
        const updatedCartItems = await cartItemModel.allWithCondition('cart_id', userId);
        const totalPrice = updatedCartItems.reduce((sum, item) => sum + item.price, 0);
        
        await cartModel.edit({ 
            user_id: cart.user_id, 
            total_price: totalPrice 
        });
        
        return { totalPrice };
    }
};

module.exports = cartService;