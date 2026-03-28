const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../backups');
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + Date.now();
const BACKUP_NAME = `complete_lims_backup_${TIMESTAMP}`;
const ARCHIVE_PATH = path.join(BACKUP_DIR, `${BACKUP_NAME}.tar.gz`);
const TEMP_SQL = path.join(BACKUP_DIR, `${BACKUP_NAME}.sql`);

async function runBackup() {
    console.log('🚀 Starting Complete System Backup...');

    try {
        // 1. Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        // PostgreSQL backup command
        const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';
        const dbUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
        try {
            execSync(`"${pgDumpPath}" "${dbUrl}" > "${TEMP_SQL}"`, { stdio: 'inherit' });
            console.log('✅ Database Exported.');
        } catch (dbErr) {
            console.error('❌ Database Export Failed:', dbErr.message);
            throw dbErr;
        }

        // 3. Create Archive (SQL + Uploads)
        console.log('📚 Creating Compressed Archive (SQL + Uploads)...');
        // We use tar -czf to create a gzipped archive. 
        // We need to change to the parent directory of backups/uploads to keep paths clean if needed, 
        // but here we'll just archive them from their respective locations.
        // On Windows, tar.exe handles absolute paths better if we use / as separator or relative paths.

        try {
            // Create a temporary manifest/list of files to include if needed, but tar can take multiple paths
            // We'll move the SQL into a folder or just add it directly.
            // Simplified: tar -czf archive.tar.gz -C [dir] SQL_FILE [dir] UPLOADS

            const cmd = `tar -czf "${ARCHIVE_PATH}" -C "${BACKUP_DIR}" "${path.basename(TEMP_SQL)}" -C "${path.join(__dirname, '..')}" "uploads"`;
            execSync(cmd, { stdio: 'inherit' });
            console.log('✅ Archive Created.');
        } catch (tarErr) {
            console.error('❌ Archival Failed:', tarErr.message);
            throw tarErr;
        }

        // 4. Cleanup
        console.log('🧹 Cleaning up temporary files...');
        if (fs.existsSync(TEMP_SQL)) {
            fs.unlinkSync(TEMP_SQL);
        }

        console.log('\n✨ COMPLETE SYSTEM BACKUP SUCCESSFUL ✨');
        console.log('Location:', ARCHIVE_PATH);
        console.log('Size:', (fs.statSync(ARCHIVE_PATH).size / (1024 * 1024)).toFixed(2), 'MB');

    } catch (err) {
        console.error('\n💥 BACKUP FAILED:', err.message);
        process.exit(1);
    }
}

runBackup();
