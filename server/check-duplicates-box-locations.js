const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function checkDuplicates() {
    try {
        console.log('=== Checking for duplicate or null IDs in box_locations ===');
        const rows = await sequelize.query(`SELECT "ID", "Box_detail", COUNT(*) as c FROM box_locations GROUP BY "ID", "Box_detail" HAVING COUNT(*) > 1`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Duplicates in box_locations:', rows);

        console.log('\n=== All box_locations matching Primer Box or GS-110 ===');
        const searchBoxes = await sequelize.query(`SELECT "ID", "Box_detail" FROM box_locations WHERE "Box_detail" ILIKE '%Primer Box%' OR "Box_detail" ILIKE '%GS-110%' OR "Box_detail" ILIKE '%test%' ORDER BY "ID"`, { type: Sequelize.QueryTypes.SELECT });
        console.log(searchBoxes);

        console.log('\n=== All rack_locations matching h or test2 ===');
        const searchRacks = await sequelize.query(`SELECT "ID", "Rack_No" FROM rack_locations WHERE "Rack_No" ILIKE '%h%' OR "Rack_No" ILIKE '%test%' ORDER BY "ID"`, { type: Sequelize.QueryTypes.SELECT });
        console.log(searchRacks);

    } catch (e) {
        console.error(e);
    }
}

checkDuplicates();
