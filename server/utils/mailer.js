const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER || 'placeholder@gmail.com',
        pass: process.env.MAIL_PASS || 'placeholder_app_password'
    }
});

const sendPurchaseOrder = async (to, subject, text, attachment) => {
    try {
        const mailOptions = {
            from: process.env.MAIL_USER || 'placeholder@gmail.com',
            to: to,
            subject: subject,
            text: text,
            attachments: [
                {
                    filename: attachment.filename,
                    content: attachment.content
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendPurchaseOrder };
