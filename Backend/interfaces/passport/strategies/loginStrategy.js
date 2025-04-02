const MyStrategy = require('./MyStrategy');
const bcrypt = require('bcrypt');
const userModel = require('../../../infrastructure/database/models/user.m');

module.exports = new MyStrategy('loginStrategy', async (username, password, email, done) => {
    try {
        const user =
            (await userModel.one(['username'], [username])) ||
            (await userModel.one(['email'], [username]));
        if (!user) {
            return done(null, false, { message: "This Username/Email doesn't exist" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return done(null, false, { message: 'Wrong Username/Email or Password' });
        }

        return done(null, user);
    } catch (err) {
        console.error('Login strategy error:', err);
        return done(err);
    }
});