const nodemailer = require('nodemailer');
const config = require('../../config');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.mail.transport.host,
            port: config.mail.transport.port,
            secure: config.mail.transport.secure,
            auth: {
                user: config.mail.transport.auth.user,
                pass: config.mail.transport.auth.pass,
            },
        });

        this.transporter.verify((error, success) => {
            if (error) {
                console.error('Email transporter configuration error:', error.message);
            } else {
                console.log('Email transporter is ready to send messages');
            }
        });
    }

    async sendEmail(to, subject, text, html) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject,
                text,
                html,
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error.message);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async sendConfirmationEmail(to, username, code) {
        const subject = 'Verify Your PhoneEcommerce Account';

        const text = `
        Hello ${username},

        Thanks for signing up with PhoneEcommerce! Use the verification code below to complete your registration:

        ${code}

        This code will expire in 10 minutes.

        - The PhoneEcommerce Team
            `.trim();

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your PhoneEcommerce Account</title>
            <style>
                body {
                font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 0;
                color: #1c1e21;
                background-color: #f0f2f5;
                }
                .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
                .email-header {
                background-color: #1877f2;
                padding: 20px;
                text-align: center;
                }
                .logo {
                font-size: 24px;
                font-weight: bold;
                color: white;
                }
                .email-body {
                padding: 20px;
                line-height: 1.5;
                }
                .verification-code {
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 4px;
                margin: 20px 0;
                text-align: center;
                color: #1877f2;
                }
                .email-footer {
                padding: 15px 20px;
                text-align: center;
                font-size: 12px;
                color: #65676b;
                border-top: 1px solid #e4e6eb;
                }
                .security-notice {
                background-color: #f0f2f5;
                padding: 10px;
                border-radius: 6px;
                font-size: 12px;
                margin-top: 20px;
                }
            </style>
            </head>
            <body>
            <div class="email-container">
                <div class="email-header">
                <div class="logo">PhoneEcommerce</div>
                </div>
                <div class="email-body">
                <h2>Account Verification</h2>
                <p>Hello <strong>${username}</strong>,</p>
                <p>Thanks for signing up with PhoneEcommerce! Please use the verification code below to complete your registration:</p>
                <div class="verification-code">${code}</div>
                <p>Enter this code in the app to verify your account.</p>
                <div class="security-notice">
                    <strong>Security Tip:</strong> For your protection, this code will expire in 10 minutes.
                </div>
                </div>
                <div class="email-footer">
                <p>© ${new Date().getFullYear()} PhoneEcommerce. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
            </body>
            </html>
            `;

        return await this.sendEmail(to, subject, text, html);
    }

    async sendThankYouEmail(to, username) {
        const subject = "Welcome to Our App!";
        const text = `Hi ${username},\n\nWelcome to our platform! Your account has been successfully created.\n\nIf you have any questions or need support, feel free to reach out.\n\nThanks,\nThe Team`;
    
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #1a73e8;">Welcome to Our App!</h2>
                <p>Hi <strong>${username}</strong>,</p>
                <p>We're excited to have you on board! Your account has been successfully created.</p>
                <p>Here's your account summary:</p>
                <ul>
                    <li><strong>Username:</strong> ${username}</li>
                    <li><strong>Email:</strong> ${to}</li>
                </ul>
                <p>If you ever forget your password, you can reset it from the login page.</p>
                <p>Need help? Just reply to this email—we're here for you.</p>
                <br>
                <p>Cheers,<br>The Team</p>
            </div>
        `;
    
        return await this.sendEmail(to, subject, text, html);
    }    
}

module.exports = new MailService();