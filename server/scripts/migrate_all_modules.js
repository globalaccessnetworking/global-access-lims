const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false
    }
);

// Define InventoryStock Model (Simplified for migration)
const InventoryStock = sequelize.define('InventoryStock', {
    item_name: DataTypes.STRING,
    manufacturer: DataTypes.STRING,
    pack_size: DataTypes.STRING,
    category: DataTypes.STRING,
    catalog_number: DataTypes.STRING,
    available_quantity: DataTypes.INTEGER,
    location_area: DataTypes.TEXT,
    location_details: DataTypes.TEXT,
    physical_location: DataTypes.TEXT,
    notes: DataTypes.TEXT,
    source: DataTypes.STRING
}, {
    tableName: 'InventoryStocks',
    timestamps: true
});

async function migrate_all() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync InventoryStock to ensure table exists and has new columns
        await InventoryStock.sync({ alter: true });
        console.log('InventoryStock table synced.');

        const dataDir = path.join(__dirname, '../data_migration');
        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

        for (const file of files) {
            console.log(`\nProcessing ${file}...`);

            // 1. Dynamic Table Migration (ext_*)
            await processDynamicTable(file, dataDir);

            // 2. Specific Lab-Stock Sync
            if (file === 'Lab-Stock.csv') {
                await processLabStock(file, dataDir);
            }
        }

        console.log('\nAll files processed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

async function processDynamicTable(file, dataDir) {
    const tableName = `ext_${file.replace('.csv', '').replace(/[\s-]/g, '_').toLowerCase()}`;
    const results = [];
    const csvPath = path.join(dataDir, file);

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                if (results.length === 0) return resolve();

                try {
                    const headers = Object.keys(results[0]);
                    await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);

                    const safeHeaders = headers.map(h => {
                        let clean = h.trim().replace(/[^a-zA-Z0-9]/g, '_');
                        if (/^\d/.test(clean)) clean = `_${clean}`;
                        return clean || 'col_unknown';
                    });

                    let createQuery = `CREATE TABLE "${tableName}" ( id SERIAL PRIMARY KEY, `;
                    createQuery += safeHeaders.map(h => `"${h}" TEXT`).join(', ');
                    createQuery += ' );';

                    await sequelize.query(createQuery);

                    const chunkSize = 100;
                    for (let i = 0; i < results.length; i += chunkSize) {
                        const chunk = results.slice(i, i + chunkSize);
                        const columns = safeHeaders.map(h => `"${h}"`).join(', ');
                        const values = chunk.map(row => {
                            return `(${headers.map(h => {
                                let val = row[h] || '';
                                val = val.replace(/'/g, "''"); // Escape quotes
                                return `'${val}'`;
                            }).join(', ')})`;
                        }).join(', ');

                        await sequelize.query(`INSERT INTO "${tableName}" (${columns}) VALUES ${values};`);
                    }
                    console.log(`Importing ${file}... [${results.length}] rows successfully inserted into [${tableName}]`);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', reject);
    });
}

async function processLabStock(file, dataDir) {
    console.log('Syncing Lab-Stock.csv to InventoryStocks...');
    const results = [];
    const csvPath = path.join(dataDir, file);

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Clear existing Lab-Stock items to avoid duplicates
                    await InventoryStock.destroy({ where: { source: 'Lab-Stock.csv' } });

                    const items = results.map(row => {
                        // Robust Fuzzy Matching for keys
                        const keys = Object.keys(row);
                        const getVal = (search) => {
                            const key = keys.find(k => k.toLowerCase().includes(search.toLowerCase()));
                            return key ? row[key] : '';
                        };

                        return {
                            item_name: getVal('Item Name'),
                            manufacturer: getVal('Manuf'), // Matches 'Manufacturer' or 'Manuf.'
                            pack_size: getVal('Pack') || getVal('Size') || getVal('Field1'),
                            catalog_number: getVal('Cat') || getVal('Catalog'),
                            category: getVal('Category'),
                            available_quantity: parseInt(getVal('Quantity') || getVal('Qty')) || 0,
                            location_area: getVal('Area'),
                            location_details: getVal('details'),
                            physical_location: `${getVal('Area')} ${getVal('details')}`.trim(),
                            notes: getVal('Notes'),
                            source: 'Lab-Stock.csv'
                        };
                    });

                    await InventoryStock.bulkCreate(items);
                    console.log(`Synced ${items.length} items to InventoryStocks.`);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', reject);
    });
}

migrate_all();
