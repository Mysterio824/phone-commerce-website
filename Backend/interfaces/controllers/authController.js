const passport = require('passport');
const AuthService = require('../../application/services/authService');
const CustomError = require('../../utils/cerror');
const config = require('../../config');

const CLIENT_URL = config.app.clientUrl;
const OAUTH_SUCCESS_REDIRECT = `${CLIENT_URL}/login?oauth_success=true`;
const OAUTH_FAILURE_REDIRECT = `${CLIENT_URL}/login?oauth_error=true`;

const authController = {
    logout: async (req, res) => {
        try {
            const accessToken = req.cookies.accessToken;
    
            const result = await AuthService.logout(accessToken);
    
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
    
            res.status(200).json({data: { result }, message: 'Logout successful.'});
        } catch (error) {
            res.status(error.statusCode || 500).json({ message: error.message || 'Logout failed.' });
        }
    },

    googleAuth: (req, res, next) => {
        passport.authenticate('google', { scope: ['profile', 'email'] }, async (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect(OAUTH_FAILURE_REDIRECT);
            }
            try {
                const { accessToken, refreshToken } = await AuthService.handleGoogleAuth(user);
                AuthService.setTokensInCookies(res, accessToken, refreshToken);
                res.redirect(OAUTH_SUCCESS_REDIRECT);
            } catch (error) {
                next(error);
            }
        })(req, res, next);
    },

    googleCallback: passport.authenticate('google', {
        successRedirect: OAUTH_SUCCESS_REDIRECT,
        failureRedirect: OAUTH_FAILURE_REDIRECT,
    }),

    login: (req, res, next) => {
        passport.authenticate('loginStrategy', async (err, user, info) => {
          
            if (err) {
                return res.status(500).json({ message: 'An error occurred while processing your request' });
            }
            if (!user) {
                return res.status(401).json({ message: info.message });
            }
            try {
                const { accessToken, refreshToken } = await AuthService.handleLogin(user);
                AuthService.setTokensInCookies(res, accessToken, refreshToken);
                res.status(200).json({
                    message: 'Login successful',
                    user: { uid: user.uid, username: user.username, email: user.email, role: user.role }
                });
            } catch (error) {
                next(error);
            }
        }) (req, res, next);
    },

    signup: (req, res, next) => {
        passport.authenticate('signupStrategy', async (err, user, info) => {
            if (err) {
                return res.status(500).json({ message: 'An error occurred while processing your request' });
            }
            if (!user) {
                return res.status(401).json({ message: info.message });
            }
            try {
                await AuthService.handleSignup(user);
                res.status(200).json({message: 'User created successfully. Please check your email to confirm your account.'});
            } catch (error) {
                next(error);
            }
        }) (req, res, next);
    },

    verifyAccount: async (req, res, next) => {
        try {
            const { verificationCode } = req.body;
            await AuthService.verifyAccount(verificationCode);
            res.status(200).json({ message: 'Account verified successfully.' });
        } catch (error) {
            next(new CustomError(error.statusCode || 404, error.message));
        }
    },

    refresh: async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            const { accessToken, newRefreshToken } = await AuthService.refresh(refreshToken);
    
            AuthService.setTokensInCookies(res, accessToken, newRefreshToken);
    
            res.status(200).json({ message: 'Token refreshed successfully.', data: { accessToken, newRefreshToken } });
        } catch (error) {
            res.status(error.statusCode || 500).json({ message: error.message || 'Token refresh failed.' });
        }
    },

    me: async (req, res) => {
        try {
            const user = req.user;
            res.status(200).json({ data: user });
        } catch (error) {
            next(error);  
        }
    }
};

module.exports = authController;