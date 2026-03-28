const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { BiologicalAsset, AvailableAntibiotic, InventoryStock, sequelize } = require('../models');

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('--- FINAL DATABASE COUNTS ---');

        const counts = {
            'Strains (BioAsset)': await BiologicalAsset.count({ where: { type: 'Strain' } }),
            'Phages (BioAsset)': await BiologicalAsset.count({ where: { type: 'Phage' } }),
            'Plasmids (BioAsset)': await BiologicalAsset.count({ where: { type: 'Plasmid' } }),
            'Primers (BioAsset)': await BiologicalAsset.count({ where: { type: 'Primer' } }),
            'Antibiotics': await AvailableAntibiotic.count(),
            'Inventory Stock': await InventoryStock.count()
        };

        console.table(counts);

        if (counts['Inventory Stock'] > 0) {
            console.log('SUCCESS: Inventory Stock is populated!');
        } else {
            console.error('FAILURE: Inventory Stock is EMPTY.');
            process.exit(1);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

verify();
