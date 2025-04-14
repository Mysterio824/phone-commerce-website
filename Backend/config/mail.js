require('dotenv').config();

const mailConfig = {
  transport: {
     host: process.env.EMAIL_HOST,
     port: parseInt(process.env.EMAIL_PORT || '587', 10),
     secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465, 
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS,
     },
  },
  defaults: {
    from: process.env.EMAIL_FROM || `"MyApp No-Reply" <${process.env.MAIL_USER}>`,
  },
};


module.exports = mailConfig; 