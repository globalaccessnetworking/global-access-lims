const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugPrimers() {
    try {
        await sequelize.authenticate();
        const primers = await sequelize.query(
            `SELECT DISTINCT "Box_detail" FROM "ext_primers_details" WHERE "Box_detail" IS NOT NULL LIMIT 20`,
            { type: QueryTypes.SELECT }
        );
        console.log("Primers Box_detail:", JSON.stringify(primers, null, 2));

        const names = await sequelize.query(
            `SELECT "ID", "Box_detail" FROM "ext_location_detail_box_name" LIMIT 5`,
            { type: QueryTypes.SELECT }
        );
        console.log("Box Name Map:", JSON.stringify(names, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugPrimers();
