const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugSamples() {
    try {
        await sequelize.authenticate();

        console.log("--- Ext Bacterial Strains Boxes ---");
        const strains = await sequelize.query(
            `SELECT DISTINCT "GS_Box_details" FROM "ext_bacterial_strains" WHERE "GS_Box_details" IS NOT NULL LIMIT 20`,
            { type: QueryTypes.SELECT }
        );
        console.log(strains.map(r => r.GS_Box_details));

        console.log("\n--- Ext Bacteriophages Boxes ---");
        const phages = await sequelize.query(
            `SELECT DISTINCT "GS_Box_details" FROM "ext_bacteriophages" WHERE "GS_Box_details" IS NOT NULL LIMIT 20`,
            { type: QueryTypes.SELECT }
        );
        console.log(phages.map(r => r.GS_Box_details));

        console.log("\n--- Ext Primers Boxes ---");
        const primers = await sequelize.query(
            `SELECT DISTINCT "Box_detail" FROM "ext_primers_details" WHERE "Box_detail" IS NOT NULL LIMIT 20`,
            { type: QueryTypes.SELECT }
        );
        console.log(primers.map(r => r.Box_detail));

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugSamples();
