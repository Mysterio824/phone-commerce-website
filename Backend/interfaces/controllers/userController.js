const UserService = require("../../application/services/userService");
const CustomError = require("../../utils/cerror");
const ROLES = require("../../application/enums/roles");

const UserController = {
  getAllUsers: async (req, res, next) => {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({
        success: true,
        message: "Users retrieved successfully.",
        data: { users },
      });
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to load users.",
      });
    }
  },

  getDetail: async (req, res, next) => {
    try {
      const user = req.user;
      res.status(200).json({
        success: true,
        user: user,
      });
    } catch (error) {
      console.error("Error getting user detail:", error);
      next(
        new CustomError(
          error.statusCode || 500,
          error.message || "Failed to load user details."
        )
      );
    }
  },

  updateDetail: async (req, res, next) => {
    try {
      const userId = req.user?.uid;

      const { email, username, oldPassword, newPassword, isInfor } = req.body;

      let updatedUser;
      let message;

      if (String(isInfor) === "true") {
        if (!username || !email) {
          return res
            .status(400)
            .json({
              message: "Username and email are required for profile update.",
            });
        }
        updatedUser = await UserService.updateUserInformation(
          userId,
          username,
          email
        );
        message = "Profile information updated successfully.";
      } else {
        if (!oldPassword || !newPassword) {
          return res
            .status(400)
            .json({ message: "Old and new passwords are required." });
        }
        await UserService.updateUserPassword(userId, oldPassword, newPassword);
        updatedUser = { uid: userId };
        message = "Password updated successfully.";
      }

      res
        .status(200)
        .json({ status: true, message: message, user: updatedUser });
    } catch (error) {
      console.error("Error updating user detail:", error);
      res.status(error.statusCode || 500).json({
        status: false,
        message: error.message || "An error occurred during update.",
      });
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const requestingUser = req.user;
      if (!requestingUser || requestingUser.role !== ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You are not authorized to perform this action.",
        });
      }

      const { id: userIdToDelete } = req.body;
      if (!userIdToDelete) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Bad Request: User ID for deletion is required.",
          });
      }
      if (requestingUser.uid === userIdToDelete) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Bad Request: Cannot delete your own account.",
          });
      }

      const result = await UserService.deleteUser(userIdToDelete);

      res
        .status(200)
        .json({
          success: true,
          message: "User deleted successfully.",
          deletedUser: result,
        });
    } catch (error) {
      console.error("Error deleting user:", error);
      res
        .status(error.statusCode || 500)
        .json({
          success: false,
          message: error.message || "Failed to delete user.",
        });
    }
  },
};

module.exports = UserController;
