const MyStrategy = require('./MyStrategy');
const validator = require('validator');
const userModel = require('../../../infrastructure/database/models/user.m');
const { hashPassword } = require('../../../utils/hashPassword');

module.exports = new MyStrategy('signupStrategy', async (username, password, email, done) => {
    try {
        if (!validator.isEmail(email)) {
            return done(null, false, { message: 'Invalid email address' });
        }
        if (!validator.isAlphanumeric(username)) {
            return done(null, false, { message: 'Invalid username' });
        }
        if (!validator.isStrongPassword(password)) {
            return done(null, false, { message: 'Password does not meet requirements' });
        }

        let existingUser = await userModel.one(['username'], [username]);
        if (existingUser) {
            return done(null, false, { message: 'This Username has been used' });
        }

        existingUser = await userModel.one(['email'], [email]);
        if (existingUser) {
            return done(null, false, { message: 'This Email has been used' });
        }

        const hashedPassword = await hashPassword(password);
        const user = { username, email, password: hashedPassword };
        return done(null, user);
    } catch (error) {
        console.error('Signup strategy error:', error.message);
        return done(error);
    }
});