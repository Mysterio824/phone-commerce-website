const passport = require('passport');
const AuthService = require('../../application/services/authService');
const CustomError = require('../../utils/cerror');
const ROLES = require('../../application/enums/roles');

module.exports = {
    logout: async (req, res) => {
        try {
            const accessToken = req.cookies.accessToken;
            if (!accessToken) {
                throw new CustomError(400, 'No access token provided.');
            }
    
            const decoded = jwt.decode(accessToken);
            if (!decoded || !decoded.sessionId) {
                throw new CustomError(400, 'Invalid access token.');
            }
    
            const { sessionId } = decoded;
    
            const result = await AuthService.logout(accessToken, sessionId);
    
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
    
            res.status(200).json(result);
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
                return res.redirect('/auth');
            }
            try {
                const { accessToken, refreshToken } = await AuthService.handleGoogleAuth(user);
                AuthService.setTokensInCookies(res, accessToken, refreshToken);
                res.redirect('/');
            } catch (error) {
                next(error);
            }
        })(req, res, next);
    },

    googleCallback: passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/auth',
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
                res.status(200).json({ accessToken, refreshToken, message: 'Login successful' });
            } catch (error) {
                next(error);
            }
        })(req, res, next);
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
                const { username } = await AuthService.handleSignup(user);
                res.status(200).json({username, message: 'User created successfully. Please check your email to confirm your account.'});
            } catch (error) {
                next(error);
            }
        })(req, res, next);
    },

    verifyAccount: async (req, res, next) => {
        try {
            const { token } = req.params;
            await AuthService.verifyAccount(token);
            res.render('auth/thankYou', {
                layout: 'blank',
            });
        } catch (error) {
            next(new CustomError(error.statusCode || 404, error.message));
        }
    },

    refresh: async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            const { accessToken, newRefreshToken } = await AuthService.refresh(refreshToken);
    
            AuthService.setTokensInCookies(res, accessToken, newRefreshToken);
    
            res.status(200).json({ message: 'Token refreshed successfully.', accessToken });
        } catch (error) {
            res.status(error.statusCode || 500).json({ message: error.message || 'Token refresh failed.' });
        }
    },
};