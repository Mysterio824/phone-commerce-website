const MyError = require('../modules/cerror');
const axios = require('axios');

module.exports = {
    getCart: async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.redirect('/auth');
            }

            let cart = await cartModel.one('user_id', user.id);
            if (!cart) {
                const exsistUser = await userModel.one('id', user.id);
                if (!exsistUser) {
                    return res.redirect('/auth');
                }
                cart = await cartModel.add({ user_id: exsistUser.id });
            }
            cart.total_price = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(cart.total_price);

            res.render('cart/cart', { cart, user });
        } catch (error) {
            console.error(error.message);
            next(new MyError(500, 'Failed to fetch cart data.'));
        }
    },

    getCartData: async (req, res, next) => {
        try {
            let page = parseInt(req.body.page || 1);
            if (page < 1) {
                return next(new MyError(404, "Your page can't be found"));
            }
            const uid = req.body.uid;
            if (!uid) {
                return res.redirect('/auth');
            }
            const per_page = parseInt(req.body.per_page) || 5;

            let cart = await cartModel.one('user_id', uid);
            if (!cart) {
                const existUser = await userModel.one('id', uid);
                if (!existUser) {
                    return res.status(400).json({ message: 'Cart not found' });
                }
                cart = await cartModel.add({ user_id: existUser.id });
            }
            const cartItems = await cartItemModel.allWithCondition('cart_id', cart.user_id);
            const totalPrice = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

            const formattedCart = {
                products: await Promise.all(cartItems.map(async (item) => {
                    const productInfo = await cartItemModel.oneWithProductInfo('id', item.id);
                    return {
                        product: { id: productInfo.product_id, price: productInfo.price, name: productInfo.name, image: productInfo.image, stock: productInfo.stock },
                        quantity: item.quantity,
                        price: item.quantity * productInfo.price,
                    };
                })),
                total_price: totalPrice,
                user_id: cart.user_id,
            };

            const total_pages = Math.ceil(formattedCart.products.length / per_page);
            if (total_pages === 0 && page === 1) {
                return res.json({ page, total_pages, per_page, cart });
            }
            if (page > total_pages) {
                page = total_pages;
            }
            formattedCart.products = formattedCart.products.slice((page - 1) * per_page, Math.min(page * per_page, formattedCart.products.length));
            res.json({ cart: formattedCart, page, total_pages, per_page });
        } catch (error) {
            console.error(error.message);
            next(new MyError(500, 'Failed to fetch cart data.'));
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

            let cart = await cartModel.one('user_id', uid);
            if (!cart) {
                const existUser = await userModel.one('id', uid);
                if (!existUser) {
                    return res.redirect('/auth');
                }
                cart = await cartModel.add({ user_id: existUser.id });
            }
            const cartItems = await cartItemModel.allWithCondition('cart_id', uid);
            const productInfo = await productModel.one('id', productId);
            let exsistItem = cartItems.filter(item => item.product_id === productId)[0];
            if (exsistItem) {
                exsistItem.quantity += quantity;
                if (exsistItem.quantity > productInfo.stock) {
                    return res.status(400).json({ message: 'Not enough stock available.' });
                }
                await cartItemModel.edit(exsistItem);
                await cartModel.edit({ user_id: cart.user_id, total_price: cart.total_price + quantity * productInfo.price });
                return res.json({ success: true });
            }

            exsistItem = { product_id: productId, quantity, cart_id: uid };
            if (exsistItem.quantity > productInfo.stock) {
                return res.status(400).json({ message: 'Not enough stock available.' });
            }
            exsistItem.price = parseInt(productInfo.price) * exsistItem.quantity;
            await cartItemModel.add(exsistItem);
            const totalPrice = cartItems.reduce((sum, item) => sum += item.price, 0) + exsistItem.price;
            await cartModel.edit({ user_id: cart.user_id, total_price: totalPrice });

            res.json({ success: true });
        } catch (error) {
            console.error(error.message);
            next(new MyError(500, 'Failed to add product to cart.'));
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

            const cart = await cartModel.one('user_id', uid);
            if (!cart) {
                return res.redirect('/auth');
            }

            const cartItems = await cartItemModel.allWithCondition('cart_id', uid);
            const exsistItem = cartItems.filter(item => item.product_id === productId)[0];
            if (!exsistItem) {
                return res.status(400).json({ message: 'Product not found in cart.' });
            }
            let totalPrice = -exsistItem.price;
            const productInfo = await productModel.one('id', productId);
            if (quantity > productInfo.stock) {
                return res.status(400).json({ message: 'Not enough stock available.' });
            }

            exsistItem.quantity = quantity;
            exsistItem.price = quantity * productInfo.price;
            await cartItemModel.edit(exsistItem);

            totalPrice = cartItems.reduce((sum, item) => sum += item.price, 0) + exsistItem.price;

            await cartModel.edit({ user_id: cart.user_id, total_price: totalPrice });
            res.json({ udpatedPrice: exsistItem.price, udpatedQuantity: exsistItem.quantity, totalPrice });
        } catch (error) {
            console.error(error.message);
            next(new MyError(500, 'Failed to update cart product.'));
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

            const cart = await cartModel.one('user_id', uid);
            if (!cart) {
                throw new MyError(404, 'Cart not found.');
            }

            const cartItems = await cartItemModel.allWithCondition('cart_id', uid);
            const exsistItem = cartItems.filter(item => item.product_id === productId)[0];
            if (!exsistItem) {
                throw new MyError(500, 'Product not found in cart.');
            }

            await cartItemModel.delete('id', exsistItem.id);

            const totalPrice = cartItems.reduce((sum, item) => sum += item.price, 0) - exsistItem.price;
            await cartModel.edit({ user_id: cart.user_id, total_price: totalPrice });

            res.json({ totalPrice });
        } catch (error) {
            console.error(error.message);
            next(new MyError(500, 'Failed to delete product from cart.'));
        }
    },
};