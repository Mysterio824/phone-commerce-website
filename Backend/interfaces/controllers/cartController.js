const cartService = require('../../application/services/cartService');
const CustomError = require('../../utils/cerror');

const cartController = {
    getCart: async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.redirect('/auth');
            }

            const cart = await cartService.getOrCreateCart(user.id);
            
            // Format the total price for display
            cart.total_price = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(cart.total_price);

            res.render('cart/cart', { cart, user });
        } catch (error) {
            console.error(error.message);
            next(new CustomError(500, 'Failed to fetch cart data.'));
        }
    },

    getCartData: async (req, res, next) => {
        try {
            let page = parseInt(req.body.page || 1);
            if (page < 1) {
                return next(new CustomError(404, "Your page can't be found"));
            }
            
            const uid = req.body.uid;
            if (!uid) {
                return res.redirect('/auth');
            }
            
            const per_page = parseInt(req.body.per_page) || 5;

            const { formattedCart, total_pages } = await cartService.getFormattedCartData(uid, page, per_page);
            
            if (total_pages === 0 && page === 1) {
                return res.json({ page, total_pages, per_page, cart: formattedCart });
            }
            
            res.json({ cart: formattedCart, page, total_pages, per_page });
        } catch (error) {
            console.error(error.message);
            next(new CustomError(500, 'Failed to fetch cart data.'));
        }
    },

    addProduct: async (req, res, next) => {
        try {
            const { uid } = req.body;
            if (!uid) {
                return res.redirect('/auth');
            }

            const productId = parseInt(req.body.productId);
            const { quantity } = req.body;
            if (!productId || quantity < 1) {
                return res.status(400).json({ message: 'Invalid product or quantity.' });
            }

            await cartService.addProductToCart(uid, productId, quantity);
            res.json({ success: true });
        } catch (error) {
            console.error(error.message);
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(new CustomError(500, 'Failed to add product to cart.'));
        }
    },

    updateProduct: async (req, res, next) => {
        try {
            const uid = req.body.uid;
            if (!uid) {
                return res.redirect('/auth');
            }
            
            const productId = parseInt(req.body.productId);
            const { quantity } = req.body;
            if (!productId || quantity < 0) {
                return res.status(400).json({ message: 'Invalid product or quantity.' });
            }

            const result = await cartService.updateCartItem(uid, productId, quantity);
            res.json(result);
        } catch (error) {
            console.error(error.message);
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(new CustomError(500, 'Failed to update cart product.'));
        }
    },

    deleteProduct: async (req, res, next) => {
        try {
            const uid = req.body.uid;
            if (!uid) {
                return res.redirect('/auth');
            }

            const productId = parseInt(req.body.productId);
            if (!productId) {
                return res.status(400).json({ message: 'Invalid product ID.' });
            }

            const { totalPrice } = await cartService.removeProductFromCart(uid, productId);
            res.json({ totalPrice });
        } catch (error) {
            console.error(error.message);
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(new CustomError(500, 'Failed to delete product from cart.'));
        }
    }
};

module.exports = cartController;