const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function find222() {
    try {
        console.log('=== Finding 222 across ext_bacterial_strains ===');
        const rows = await sequelize.query(`SELECT id, "Strain_No", "GS_Rack_Number", "GD_Rack_Number", "GS_Box_details", "GD_Box_detail", "Specie" FROM ext_bacterial_strains WHERE "GS_Rack_Number"::text = '222' OR "GD_Rack_Number"::text = '222' OR "GS_Box_details"::text = '222' OR "GD_Box_detail"::text = '222' OR "Specie"::text = '222'`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Strains containing 222:', rows);

        console.log('\n=== Checking if 222 exists in box_locations ===');
        const boxes = await sequelize.query(`SELECT * FROM box_locations WHERE "id"::text = '222' OR "ID"::text = '222' OR "Box_detail" ILIKE '%222%'`, { type: Sequelize.QueryTypes.SELECT });
        console.log('box_locations 222:', boxes);

        console.log('\n=== Checking if 222 exists in BiologicalAssets or InventoryStocks ===');
        const assets = await sequelize.query(`SELECT id, type, name, storage_location_id FROM "BiologicalAssets" WHERE id = 222 LIMIT 5`, { type: Sequelize.QueryTypes.SELECT });
        console.log('BiologicalAssets 222:', assets);

    } catch (e) {
        console.error(e);
    }
}

find222();
