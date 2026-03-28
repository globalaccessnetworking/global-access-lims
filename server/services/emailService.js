const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Send alert digest email
exports.sendAlertDigest = async (userEmail, alerts) => {
    try {
        const criticalCount = alerts.filter(a => a.priority === 'critical').length;
        const warningCount = alerts.filter(a => a.priority === 'warning').length;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .alert { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
                    .critical { background: #fef2f2; border-color: #ef4444; }
                    .warning { background: #fffbeb; border-color: #f59e0b; }
                    .info { background: #eff6ff; border-color: #3b82f6; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔔 LIMS Alert Digest</h1>
                        <p>Daily System Notifications</p>
                    </div>
                    <div class="content">
                        <h2>Summary</h2>
                        <p><strong>${criticalCount}</strong> Critical Alerts | <strong>${warningCount}</strong> Warnings</p>
                        
                        <h3>Alerts Requiring Attention:</h3>
                        ${alerts.map(alert => `
                            <div class="alert ${alert.priority}">
                                <strong>${alert.title}</strong>
                                <p>${alert.message}</p>
                                <small>Priority: ${alert.priority.toUpperCase()}</small>
                            </div>
                        `).join('')}
                        
                        <p style="margin-top: 30px;">
                            <a href="${process.env.APP_URL || 'http://localhost:5174'}/alerts" 
                               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                View All Alerts
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>Bacteriophage LIMS - Automated Alert System</p>
                        <p>This is an automated message. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: `"LIMS Alert System" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `🔔 LIMS Daily Digest - ${criticalCount} Critical Alerts`,
            html
        });

        console.log(`Alert digest sent to ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

// Send individual alert
exports.sendAlertEmail = async (userEmail, alert) => {
    try {
        const priorityColors = {
            critical: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        await transporter.sendMail({
            from: `"LIMS Alert System" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `⚠️ ${alert.priority.toUpperCase()}: ${alert.title}`,
            html: `
                <div style="font-family: Arial; padding: 20px; background: #f4f4f4;">
                    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border-top: 4px solid ${priorityColors[alert.priority]};">
                        <h2 style="color: ${priorityColors[alert.priority]};">${alert.title}</h2>
                        <p>${alert.message}</p>
                        <p style="margin-top: 20px;">
                            <a href="${process.env.APP_URL || 'http://localhost:5174'}/alerts" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View in LIMS</a>
                        </p>
                    </div>
                </div>
            `
        });

        return true;
    } catch (error) {
        console.error('Alert email error:', error);
        return false;
    }
};
