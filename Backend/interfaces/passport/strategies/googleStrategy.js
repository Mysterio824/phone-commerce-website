const OAuth2Strategy = require('passport-oauth2').Strategy;
const jwt = require('jsonwebtoken');
const { v5: uuidv5 } = require('uuid');
const userModel = require('../../../infrastructure/database/models/user.m');
const { hashPassword } = require('../../../utils/hashUtils');
const crypto = require('crypto');

module.exports = new OAuth2Strategy(
    {
        authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
        tokenURL: 'https://oauth2.googleapis.com/token',
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'https://localhost:3000/auth/google/callback',
        scope: ['openid', 'profile', 'email'],
    },
    async (accessToken, refreshToken, params, profile, done) => {
        try {
            if (!params || !params.id_token) {
                return done(null, false, { message: 'No ID token returned from Google' });
            }
            const decoded = jwt.decode(params.id_token);
            const { sub, name, email } = decoded;
            const namespace = uuidv5.URL;
            const oauthUuid = uuidv5(sub, namespace);

            let user = await userModel.one(['uid'], [oauthUuid]);
            if (!user) {
                const existingEmail = await userModel.one(['email'], [email]);
                if (existingEmail) {
                    return done(null, false, { message: 'Email already exists' });
                }

                const password = crypto.randomBytes(10).toString('hex').slice(0, 10);
                const hashedPassword = await hashPassword(password);
                user = await userModel.add({
                    uid: oauthUuid,
                    username: name,
                    password: hashedPassword,
                    email,
                });
            }

            return done(null, user);
        } catch (err) {
            console.error('Google OAuth error:', err);
            return done(err);
        }
    }
);