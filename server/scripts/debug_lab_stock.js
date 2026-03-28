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
        logging: console.log
    }
);

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

async function run() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const file = 'Lab-Stock.csv';
        const csvPath = path.join(__dirname, '../data_migration', file);

        console.log(`Reading ${csvPath}`);

        const results = [];
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`Parsed ${results.length} rows.`);
                if (results.length > 0) {
                    console.log('Sample Row Keys:', Object.keys(results[0]));
                }

                try {
                    await InventoryStock.sync({ alter: true });
                    // Wipe table to ensure no duplicates
                    await InventoryStock.destroy({ truncate: true, cascade: false });

                    const items = results.map(row => {
                        // Keys from previous check: ['ID', 'Item Name', 'Manufacturer', 'Cat .', 'Field1', 'Category', 'Available Quantity', ...?]
                        // We use fuzzy finder
                        const keys = Object.keys(row);
                        const get = (s) => row[keys.find(k => k.toLowerCase().includes(s.toLowerCase()))] || '';

                        return {
                            item_name: row['Item Name'] || get('Item Name'),
                            manufacturer: row['Manufacturer'] || get('Manuf'),
                            pack_size: row['Field1'] || get('Pack') || get('Size'),
                            catalog_number: row['Cat .'] || get('Cat'),
                            category: row['Category'] || get('Category'),
                            available_quantity: parseInt(get('Quantity') || get('Qty')) || 0,
                            location_area: get('Area'),
                            location_details: get('details'), // 'Location details'
                            physical_location: `${get('Area')} ${get('details')}`.trim(),
                            notes: get('Notes'),
                            source: 'Lab-Stock.csv'
                        };
                    });

                    console.log('Mapped Items Sample:', items[0]);

                    await InventoryStock.bulkCreate(items);
                    console.log(`Inserted ${items.length} items.`);
                    process.exit(0);
                } catch (e) {
                    console.error('Error during DB op:', e);
                    process.exit(1);
                }
            });

    } catch (err) {
        console.error('Setup error:', err);
    }
}

run();
