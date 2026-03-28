const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 30; // Keep 30 days of backups

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create database backup
async function createBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const backupFile = path.join(BACKUP_DIR, `lims_backup_${timestamp}.sql`);

        console.log(`Creating backup: ${backupFile}`);

        // PostgreSQL backup command
        const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bacteriophage_lims';
        const command = `pg_dump "${dbUrl}" > "${backupFile}"`;

        await execAsync(command);

        console.log(`✓ Backup created successfully: ${backupFile}`);

        // Cleanup old backups
        await cleanupOldBackups();

        return { success: true, file: backupFile };
    } catch (error) {
        console.error('Backup failed:', error);
        return { success: false, error: error.message };
    }
}

// Cleanup old backups (keep only MAX_BACKUPS)
async function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('lims_backup_') && f.endsWith('.sql'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        // Delete old backups
        if (files.length > MAX_BACKUPS) {
            const toDelete = files.slice(MAX_BACKUPS);
            toDelete.forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`Deleted old backup: ${file.name}`);
            });
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

// Restore from backup
async function restoreBackup(backupFile) {
    try {
        console.log(`Restoring from: ${backupFile}`);

        const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bacteriophage_lims';
        const command = `psql "${dbUrl}" < "${backupFile}"`;

        await execAsync(command);

        console.log(`✓ Database restored successfully`);
        return { success: true };
    } catch (error) {
        console.error('Restore failed:', error);
        return { success: false, error: error.message };
    }
}

// List available backups
function listBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('lims_backup_') && f.endsWith('.sql'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                size: fs.statSync(path.join(BACKUP_DIR, f)).size,
                created: fs.statSync(path.join(BACKUP_DIR, f)).mtime
            }))
            .sort((a, b) => b.created.getTime() - a.created.getTime());

        return files;
    } catch (error) {
        console.error('List backups failed:', error);
        return [];
    }
}

// Export settings
function exportSettings() {
    try {
        const settings = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            environment: {
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT,
                // Don't export sensitive data
            },
            features: {
                emailNotifications: !!process.env.SMTP_USER,
                backupEnabled: true
            }
        };

        const settingsFile = path.join(BACKUP_DIR, `settings_${Date.now()}.json`);
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));

        console.log(`✓ Settings exported: ${settingsFile}`);
        return { success: true, file: settingsFile };
    } catch (error) {
        console.error('Export settings failed:', error);
        return { success: false, error: error.message };
    }
}

// Import settings
function importSettings(settingsFile) {
    try {
        const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        console.log(`✓ Settings imported from: ${settingsFile}`);
        return { success: true, settings };
    } catch (error) {
        console.error('Import settings failed:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    createBackup,
    restoreBackup,
    listBackups,
    exportSettings,
    importSettings,
    cleanupOldBackups
};

// Run backup if called directly
if (require.main === module) {
    createBackup().then(result => {
        if (result.success) {
            console.log('Backup completed successfully');
            process.exit(0);
        } else {
            console.error('Backup failed');
            process.exit(1);
        }
    });
}
