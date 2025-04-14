const userModel = require('../../infrastructure/database/models/user.m');
const CustomError = require('../../utils/cerror');
const { hashPassword, comparePassword } = require('../../utils/hashUtils');

class UserService {
    async getUserById(userId) {
        const user = await userModel.one('uid', userId);
        if (!user) {
             throw new CustomError(404, 'User not found.');
        }
        delete user.password;
        return user;
    }

    
    async updateUserInformation(userId, newUsername, newEmail) {
        if (!userId || !newUsername || !newEmail) {
            throw new CustomError(400, 'User ID, username, and email are required.');
        }

        if (!/\S+@\S+\.\S+/.test(newEmail)) {
            throw new CustomError(400, 'Invalid email format.');
        }

        const existingUsernameUser = await userModel.one('username', newUsername);
        if (existingUsernameUser && existingUsernameUser.uid !== userId) {
            throw new CustomError(409, 'Username already exists.');
        }

        const existingEmailUser = await userModel.one('email', newEmail);
        if (existingEmailUser && existingEmailUser.uid !== userId) {
            throw new CustomError(409, 'Email already exists.');
        }

        const updateData = {
            uid: userId,
            username: newUsername,
            email: newEmail,
        };

        const updatedUser = await userModel.edit(updateData, 'uid');

        if (!updatedUser) {
            throw new CustomError(500, 'Failed to update user information.');
        }

        delete updatedUser.password;
        return updatedUser;
    }

    async updateUserPassword(userId, oldPassword, newPassword) {
         if (!userId || !oldPassword || !newPassword) {
            throw new CustomError(400, 'User ID, old password, and new password are required.');
        }
         if (newPassword.length < 6) {
            throw new CustomError(400, 'New password must be at least 6 characters long.');
         }

        const currentUser = await userModel.one('uid', userId);
        if (!currentUser) {
            throw new CustomError(404, 'User not found.');
        }
        if (!currentUser.password) {
             throw new CustomError(400, 'Cannot update password for OAuth user.');
        }

        const isMatch = await comparePassword(oldPassword, currentUser.password);
        if (!isMatch) {
            throw new CustomError(401, 'Incorrect old password.');
        }

        const newPasswordHash = await hashPassword(newPassword);

        const updateData = {
            uid: userId,
            password: newPasswordHash,
        };

        const updatedUser = await userModel.edit(updateData, 'uid');

        if (!updatedUser) {
            throw new CustomError(500, 'Failed to update password.');
        }

        return true;
    }

    async deleteUser(userIdToDelete) {
        if (!userIdToDelete) {
            throw new CustomError(400, 'User ID is required for deletion.');
        }

        const result = await userModel.delete('uid', userIdToDelete);

        if (!result) {
            throw new CustomError(404, 'User not found for deletion.');
        }

        return result;
    }
}

module.exports = new UserService(); 