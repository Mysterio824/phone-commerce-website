const MyError = require('../modules/cerror');

module.exports = {
    getDetail: (req, res, next) => {
        try {
            const user = req.user;
            res.render('users/userDetail', { user });
        } catch (error) {
            next(new MyError(404, "Can't find this page"));
        }
    },

    getCheckout: async (req, res, next) => {
        // try {
        //     const user = req.user;
        //     let cart = await cartModel.one('user_id', user.id);
        //     if (!cart) {
        //         return res.redirect('/auth');
        //     }
        //     cart.total_price = new Intl.NumberFormat('en-US', {
        //         style: 'decimal',
        //         minimumFractionDigits: 2,
        //         maximumFractionDigits: 2
        //     }).format(cart.total_price);

        //     res.render('cart/proceedCheckout', { cart, user });
        // } catch (error) {
        //     console.error(error.message);
        //     next(new MyError(500, 'Failed to fetch cart data.'));
        // }
    },

    getThankYou: (req, res, next) => {
        try {
            const user = req.user;
            res.render('users/thankYou', { user });
        } catch (error) {
            console.error(error.message);
            next(new MyError(404, "Your page is missing"));
        }
    }
}