const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function inspect() {
    try {
        console.log('=== 1. Inspecting box_locations ===');
        const boxes = await sequelize.query(`SELECT "ID", "Box_detail" FROM box_locations ORDER BY "ID" ASC NULLS FIRST LIMIT 30`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Sample box_locations:', boxes);

        console.log('\n=== 2. Inspecting rack_locations ===');
        const racks = await sequelize.query(`SELECT "ID", "Rack_No" FROM rack_locations ORDER BY "ID" ASC NULLS FIRST LIMIT 30`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Sample rack_locations:', racks);

        console.log('\n=== 3. Inspecting ext_primers_details (Sample 20) ===');
        const primers = await sequelize.query(`SELECT id, "ID", "Primer_Name", "Box_detail", "Freezer_Shelve", "Freezer" FROM ext_primers_details LIMIT 20`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Sample primers:', primers);

        console.log('\n=== 4. Checking distinct Box_detail in ext_primers_details ===');
        const distinctBoxes = await sequelize.query(`SELECT DISTINCT "Box_detail" FROM ext_primers_details`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Distinct Box_detail in primers:', distinctBoxes.map(b => b.Box_detail));

        console.log('\n=== 5. Checking distinct Freezer_Shelve in ext_primers_details ===');
        const distinctRacks = await sequelize.query(`SELECT DISTINCT "Freezer_Shelve" FROM ext_primers_details`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Distinct Freezer_Shelve in primers:', distinctRacks.map(r => r.Freezer_Shelve));

    } catch (err) {
        console.error('Error during inspection:', err);
    }
}

inspect();
