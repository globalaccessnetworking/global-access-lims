const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { StorageLocation } = require('./models');
const sequelize = require('./config/database');

async function normalizeLocations() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        // 1. Load CSV Mappings
        const loadMap = (filename, idCol, valCol) => {
            const content = fs.readFileSync(path.join(__dirname, 'data_migration', filename));
            const records = csv.parse(content, { columns: true, skip_empty_lines: true });
            const map = {};
            records.forEach(r => {
                map[r[idCol]] = r[valCol];
            });
            return map;
        };

        const freezerMap = loadMap('Location detail-freezer.csv', 'ID', 'Freezer');
        const rackMap = loadMap('Location detail-Rack.csv', 'ID', 'Rack-No');
        const boxMap = loadMap('Location detail-Box name.csv', 'ID', 'Box-detail');

        console.log("Mappings loaded.");
        console.log(`Freezers: ${Object.keys(freezerMap).length}`);
        console.log(`Racks: ${Object.keys(rackMap).length}`);
        console.log(`Boxes: ${Object.keys(boxMap).length}`);

        // 2. Fetch all locations
        const locations = await StorageLocation.findAll();
        console.log(`Processing ${locations.length} locations...`);

        let updates = 0;
        for (const loc of locations) {
            let changed = false;

            // Map Freezer
            // The table might currently hold the ID as a string or integer
            if (freezerMap[loc.freezer_name]) {
                loc.freezer_name = freezerMap[loc.freezer_name];
                changed = true;
            }

            // Map Rack
            // Use loose comparison in case DB has '1' and map has 1
            if (rackMap[loc.rack]) {
                loc.rack = rackMap[loc.rack];
                changed = true;
            }

            // Map Box
            // Check if box is an ID that exists in the map
            // Note: Some box names are already names. We need to be careful not to double-map if names overlap with IDs (unlikely for "Box 1" vs "1")
            // But if the box column currently holds "1", "2", etc., and the map has key "1" -> "Dr. Shafiq...", we should map it.
            if (boxMap[loc.box]) {
                loc.box = boxMap[loc.box];
                changed = true;
            }

            if (changed) {
                await loc.save();
                updates++;
            }

            if (updates % 100 === 0 && changed) process.stdout.write('.');
        }

        console.log(`\nUpdated ${updates} locations.`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sequelize.close();
    }
}

normalizeLocations();
