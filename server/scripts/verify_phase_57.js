const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { InventoryStock, sequelize } = require('../models');

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const longText = 'A very long location description that exceeds the typical 255 character limit of a standard string field to ensure that the TEXT data type modification was successful and we can store detailed location information as requested by the user for the Inventory Logic Restoration phase.';

        const newItem = await InventoryStock.create({
            item_name: 'Verification Reagent X',
            manufacturer: 'Test Corp',
            pack_size: '100ml',
            category: 'Reagent',
            available_quantity: 50,
            location_area: 'Main Lab',
            location_details: longText,
            notes: 'Created via verification script'
        });

        console.log('Created Item:', newItem.id);

        const fetched = await InventoryStock.findByPk(newItem.id);
        if (fetched.location_details === longText) {
            console.log('SUCCESS: Location details stored correctly as TEXT.');
        } else {
            console.error('FAILURE: Location details mismatch or truncated.');
            console.log('Expected length:', longText.length);
            console.log('Actual length:', fetched.location_details.length);
        }

        // Clean up
        await fetched.destroy();
        console.log('Cleaned up test item.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
