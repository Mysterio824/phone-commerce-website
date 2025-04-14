const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
    if (!password) {
        throw new Error('Password cannot be empty.');
    }
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        return hashedPassword;
    } catch (err) {
        console.error('Error hashing password:', err.message);
        throw new Error('Failed to hash password.');
    }
};

const comparePassword = async (inputPassword, storedPasswordHash) => {
    if (!inputPassword || !storedPasswordHash) {
        return false;
    }
    try {
        const match = await bcrypt.compare(inputPassword, storedPasswordHash);
        return match;
    } catch (err) {
        console.error('Error comparing password:', err.message);
        return false;
    }
};

module.exports = {
    hashPassword,
    comparePassword,
}; 