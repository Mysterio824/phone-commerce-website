const passport = require('passport');
const loginStrategy = require('./strategies/loginStrategy');
const signupStrategy = require('./strategies/signupStrategy');
const googleStrategy = require('./strategies/googleStrategy');

passport.use(loginStrategy);
passport.use(signupStrategy);
passport.use('google', googleStrategy);

module.exports = passport;