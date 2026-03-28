const cron = require('node-cron');
const backupService = require('./services/backupService');

// Schedule daily backup at 2 AM
function scheduleDailyBackup() {
    // Cron format: minute hour day month weekday
    // '0 2 * * *' = Every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('Running scheduled daily backup...');
        const result = await backupService.createBackup();

        if (result.success) {
            console.log('✓ Scheduled backup completed successfully');
        } else {
            console.error('✗ Scheduled backup failed:', result.error);
        }
    }, {
        timezone: "America/Los_Angeles" // Adjust to your timezone
    });

    console.log('✓ Daily backup scheduler initialized (runs at 2:00 AM)');
}

module.exports = { scheduleDailyBackup };
