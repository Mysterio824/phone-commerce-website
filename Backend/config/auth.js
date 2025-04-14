require('dotenv').config(); 

const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRY || '30m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRY || '8h',
    emailConfirmationSecret: process.env.EMAIL_CONFIRMATION_SECRET,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  
  googleOAuth: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    scope: ['profile', 'email'],
  },
};


// Validate essential secrets are present
if (!authConfig.jwt.secret) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1);
}
if (!authConfig.session.secret) {
    console.error("FATAL ERROR: SESSION_SECRET is not defined in environment variables.");
    process.exit(1);
}
if (!authConfig.jwt.emailConfirmationSecret) {
    console.error("FATAL ERROR: EMAIL_CONFIRMATION_SECRET is not defined in environment variables.");
    process.exit(1);
}


module.exports = authConfig; 