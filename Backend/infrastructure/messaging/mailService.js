const nodemailer = require('nodemailer');
require('dotenv').config();

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
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

    async sendConfirmationEmail(to, username, confirmationUrl) {
        const subject = 'Confirm Your Email';
        const text = `Please confirm your email by clicking the following link: ${confirmationUrl}`;
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #333;">Confirm Your Email</h2>
                <p>Dear ${username},</p>
                <p>
                    Thank you for registering with our app. To complete your registration, please confirm your account by clicking
                    <a href="${confirmationUrl}" style="color: #1a73e8; text-decoration: none;">here!</a>
                </p>
                <p>If the link above does not work, please copy and paste the following URL into your browser:</p>
                <p style="color: #1a73e8;">${confirmationUrl}</p>
                <p>Best regards,<br>Your App Team</p>
            </div>
        `;
        return await this.sendEmail(to, subject, text, html);
    }
}

module.exports = new MailService();