const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    const saltRounds = 10;
    try {
        return await bcrypt.hash(password, saltRounds);
    } catch (err) {
        throw new Error(`Password hashing failed: ${err.message}`);
    }
};

module.exports = { hashPassword };