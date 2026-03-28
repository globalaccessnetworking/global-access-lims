const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugData() {
    try {
        await sequelize.authenticate();
        console.log("Connected.");

        // 1. Check StorageLocations content
        console.log("--- StorageLocations Sample ---");
        const slSamples = await sequelize.query(
            `SELECT id, freezer_name, rack, box, position FROM "StorageLocations" LIMIT 10`,
            { type: QueryTypes.SELECT }
        );
        console.log(slSamples);

        // 2. Check Freezer Table
        console.log("--- Freezers ---");
        const freezers = await sequelize.query(
            `SELECT * FROM "ext_location_detail_freezer"`,
            { type: QueryTypes.SELECT }
        );
        console.log(freezers);

        // 3. Check Box Table
        console.log("--- Box Names Sample ---");
        const boxes = await sequelize.query(
            `SELECT * FROM "ext_location_detail_box_name" LIMIT 10`,
            { type: QueryTypes.SELECT }
        );
        console.log(boxes);

        // 4. Check Biological Assets and Ext Tables for Lineage Columns
        console.log("--- Biological Assets columns ---");
        // We'll just infer from a select or check information_schema
        const primerCols = await sequelize.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'ext_primers_details'`,
            { type: QueryTypes.SELECT }
        );
        console.log("Primer Cols:", primerCols.map(c => c.column_name));

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugData();
