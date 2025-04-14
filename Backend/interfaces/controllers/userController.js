const UserService = require('../../application/services/userService');
const CartModel = require('../../infrastructure/database/models/cart.m');
const CustomError = require('../../utils/cerror');
const ROLES = require('../../application/enums/roles');

const UserController = {
    getDetail: async (req, res, next) => {
        try {
            const user = req.user;
            if (!user || !user.uid) {
                return res.status(401).json({ message: "Unauthorized: Authentication required." });
            }
            res.status(200).json({
                success: true,
                user: user
           });
        } catch (error) {
            console.error("Error getting user detail:", error);
            next(new CustomError(error.statusCode || 500, error.message || "Failed to load user details."));
        }
    },

    updateDetail: async (req, res, next) => {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                return res.status(401).json({ message: "User not authenticated." });
            }

            const { email, username, oldPassword, newPassword, isInfor } = req.body;

            let updatedUser;
            let message;

            if (String(isInfor) === 'true') {
                 if (!username || !email) {
                    return res.status(400).json({ message: "Username and email are required for profile update." });
                }
                updatedUser = await UserService.updateUserInformation(userId, username, email);
                message = 'Profile information updated successfully.';

            } else {
                if (!oldPassword || !newPassword) {
                    return res.status(400).json({ message: "Old and new passwords are required." });
                }
                 await UserService.updateUserPassword(userId, oldPassword, newPassword);
                 updatedUser = { uid: userId };
                 message = 'Password updated successfully.';
            }

            res.status(200).json({ status: true, message: message, user: updatedUser });

        } catch (error) {
            console.error("Error updating user detail:", error);
            res.status(error.statusCode || 500).json({
                 status: false,
                 message: error.message || "An error occurred during update."
            });
        }
    },

    deleteUser: async (req, res, next) => {
        try {
            const requestingUser = req.user;
            if (!requestingUser || requestingUser.role !== ROLES.ADMIN) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You are not authorized to perform this action."
                });
            }

            const { id: userIdToDelete } = req.body;
            if (!userIdToDelete) {
                return res.status(400).json({ success: false, message: "Bad Request: User ID for deletion is required." });
            }
            if (requestingUser.uid === userIdToDelete) {
                 return res.status(400).json({ success: false, message: "Bad Request: Cannot delete your own account."});
            }

            const result = await UserService.deleteUser(userIdToDelete);

            res.status(200).json({ success: true, message: "User deleted successfully.", deletedUser: result });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to delete user." });
        }
    },

    getCheckout: async (req, res, next) => {
        try {
            const user = req.user;
            if (!user || !user.uid) {
                return res.status(401).json({ message: "Unauthorized: Authentication required." });
            }

            let cart = await CartModel.one('user_id', user.uid);

            if (!cart || cart.items?.length === 0) {
                 console.log(`Checkout attempt for user ${user.uid} with no cart or empty cart.`);
                 return res.status(200).json({ success: true, cart: null, message: "Cart is empty or not found." });
            }

            cart.total_price_formatted = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(cart.total_price || 0);

            res.status(200).json({
                success: true,
                cart: cart, 
             });
        } catch (error) {
            console.error('Error getting checkout page:', error);
            next(new CustomError(error.statusCode || 500, error.message || 'Failed to load checkout page.'));
        }
    }
};

module.exports = UserController; 