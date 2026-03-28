const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres', // Adjust if MySQL
        logging: false
    }
);

async function migrateDeepParse() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const dataDir = path.join(__dirname, '../data_migration');
        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

        for (const file of files) {
            console.log(`\nProcessing ${file}...`);
            const records = [];
            const headers = new Set();

            // 1. Read CSV to get Headers and Data
            await new Promise((resolve, reject) => {
                fs.createReadStream(path.join(dataDir, file))
                    .pipe(csv())
                    .on('headers', (h) => h.forEach(head => headers.add(head)))
                    .on('data', (row) => records.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });

            if (records.length === 0) {
                console.log(`Skipping ${file} - No data.`);
                continue;
            }

            // 2. Sanitize Table Name
            // prefix with 'ext_' to avoid collisions and easy identification
            const tableName = 'ext_' + file.replace('.csv', '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_'); // remove duplicate underscores

            // 3. Dynamic Create Table
            // Infer columns. Default TEXT.
            // We use raw queries for flexibility
            const columnDefs = Array.from(headers).map(header => {
                let colName = header.trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/^[0-9]/, 'n_$&');

                // Avoid collision with primary key 'id'
                if (colName === 'id') colName = 'csv_id';

                // Basic Type Inference could go here, but TEXT is safest for "Deep Parse"
                return `"${colName || 'col_' + Math.random().toString(36).substr(2, 4)}" TEXT`;
            });

            // Add ID column
            columnDefs.unshift('"id" SERIAL PRIMARY KEY');

            const createSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefs.join(', ')});`;

            // Drop valid first to ensure schema match if re-running?
            // User requested "physically opens... builds SQL table". 
            // Better to Drop if Exists to ensure schema sync.
            await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
            await sequelize.query(createSql);
            console.log(`Created table: ${tableName}`);

            // 4. Bulk Insert
            if (records.length > 0) {
                // Map records to sanitized column keys
                const sanitizedRecords = records.map(row => {
                    const newRow = {};
                    Object.keys(row).forEach(key => {
                        let colName = key.trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '_')
                            .replace(/^[0-9]/, 'n_$&');

                        if (colName === 'id') colName = 'csv_id';

                        if (colName) newRow[colName] = row[key];
                    });
                    return newRow;
                });

                // Helper to chunk inserts
                const chunkSize = 100;
                for (let i = 0; i < sanitizedRecords.length; i += chunkSize) {
                    const chunk = sanitizedRecords.slice(i, i + chunkSize);

                    const keys = Object.keys(chunk[0]).map(k => `"${k}"`).join(', ');
                    const values = chunk.map(r => {
                        return `(${Object.values(r).map(v => {
                            // Escape single quotes
                            const safe = (v || '').replace(/'/g, "''");
                            return `'${safe}'`;
                        }).join(', ')})`;
                    }).join(', ');

                    const insertSql = `INSERT INTO "${tableName}" (${keys}) VALUES ${values};`;
                    try {
                        await sequelize.query(insertSql);
                    } catch (e) {
                        console.error(`Error inserting chunk into ${tableName}:`, e.message);
                    }
                }
                console.log(`Inserted ${records.length} rows into ${tableName}`);
            }
        }

        console.log('\n--- Deep Parse Migration Complete ---');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateDeepParse();
