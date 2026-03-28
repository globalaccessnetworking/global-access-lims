const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { InventoryStock, sequelize } = require('../models');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Force Sync to drop and recreate table with new schema
        await InventoryStock.sync({ force: true });
        console.log('InventoryStock table purged and re-synced.');

        const results = [];
        const csvPath = path.join(__dirname, '../data_migration/Lab-Stock.csv');

        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`Processing Lab-Stock.csv: ${results.length} records found.`);

                let count = 0;
                for (const row of results) {
                    const item_name = row['Item Name'];
                    if (!item_name) continue;

                    // Clean and Map Data
                    const manufacturer = row['Manufacturer'] || '';
                    const pack_size = row['Pack Size'] || '';
                    const category = row['Category'] || 'General';
                    const qtyRaw = row['Available Quantity'] || row['Quantity'] || '0';
                    const available_quantity = parseInt(qtyRaw.replace(/[^0-9-]/g, '')) || 0; // Strip non-numeric chars

                    // Location Logic: Combine 'Location-Area-final' and 'Location' as fallback
                    const location_area = row['Location-Area-final'] || row['Location-Area'] || row['Location'] || '';

                    // Details Logic: Combine 'Location details' and 'Location shelf'
                    const detail1 = row['Location details'] || '';
                    const detail2 = row['Location shelf'] || '';
                    const location_details = [detail1, detail2].filter(Boolean).join(' - ');

                    const catalog_number = row['Cat .'] || '';
                    const notes = row['Field1'] || '';

                    await InventoryStock.create({
                        item_name,
                        manufacturer,
                        pack_size,
                        category,
                        available_quantity,
                        location_area,
                        location_details,
                        catalog_number,
                        notes,
                        source: 'Lab-Stock.csv Full Migration'
                    });
                    count++;
                }

                console.log(`Successfully migrated ${count} records.`);
                process.exit(0);
            });
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
