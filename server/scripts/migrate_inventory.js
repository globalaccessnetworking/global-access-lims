const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const csv = require('csv-parser');
const { sequelize, InventoryStock, BiologicalAsset, StorageLocation } = require('../models');

const MIGRATION_DIR = path.join(__dirname, '../data_migration');

async function processFile(filename, processor) {
    const filePath = path.join(MIGRATION_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filename}`);
        return;
    }

    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`\nProcessing ${filename}: ${results.length} records found.`);
                try {
                    await processor(results);
                    console.log(`Successfully processed ${filename}`);
                    resolve();
                } catch (err) {
                    console.error(`Error processing ${filename}:`, err);
                    reject(err);
                }
            })
            .on('error', reject);
    });
}

async function migrateInventory() {
    await processFile('Lab-Stock.csv', async (records) => {
        if (records.length === 0) return;

        // Log headers for debug
        console.log('Headers:', Object.keys(records[0]));

        for (const row of records) {
            // Mapping based on user description + guess
            // "Item Name", "Manufacturer", "Pack Size", "Category", "Available Quantity", "Location Details"
            const item_name = row['Item Name'] || row['Item'] || row['Name'];
            const manufacturer = row['Manufacturer'] || row['Make'];
            const pack_size = row['Pack Size'] || row['Size'];
            const category = row['Category'] || row['Type'];

            const qtyRaw = row['Available Quantity'] || row['Quantity'] || '0';
            // Prioritize Location-Area-final
            const location_area = row['Location-Area-final'] || row['Location Details'] || row['Location'];
            const location_details = row['Location details'] || row['Location shelf'] || '';
            // Store extra details in notes
            const notes = `Shelf: ${row['Location shelf'] || 'N/A'}`;

            if (!item_name) continue;

            await InventoryStock.create({
                item_name,
                manufacturer,
                pack_size,
                category,
                available_quantity: parseInt(qtyRaw) || 0,
                location_area,
                location_details,
                notes,
                source: 'Lab-Stock.csv Migration'
            });
        }
    });
}

// Placeholder for other files to avoid breaking existing data blindly
// We can enable these if the user explicitly wants to Overwrite/Merge
async function migrateAssets() {
    // Example: Bacterial Strains.csv
    await processFile('Bacterial Strains.csv', async (records) => {
        console.log(`Skipping detailed asset migration for now to prevent duplication. Found ${records.length} strains.`);
        // To implement: Check strain_number existence, then create.
    });
}

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync InventoryStock table
        await InventoryStock.sync({ force: true }); // Reset Inventory Table for clean migration
        console.log('InventoryStock table synced.');

        await migrateInventory();
        await migrateAssets();

        console.log('\nMigration Complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
