const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function findPopulatedBox() {
    try {
        await sequelize.authenticate();

        // We know ID 20 has data (from previous debug_samples)
        const testId = 20;
        const boxRec = await sequelize.query(
            `SELECT "Box_detail" FROM "ext_location_detail_box_name" WHERE "ID" = :testId`,
            { replacements: { testId }, type: QueryTypes.SELECT }
        );

        if (boxRec.length > 0) {
            console.log(`Box ID ${testId} has Name: "${boxRec[0].Box_detail}"`);

            // Now run the magnet query for this box ID manually to see count
            const strains = await sequelize.query(
                `SELECT count(*) as count FROM "ext_bacterial_strains" WHERE CAST("GS_Box_details" AS VARCHAR) = CAST(:testId AS VARCHAR)`,
                { replacements: { testId }, type: QueryTypes.SELECT }
            );
            console.log(`Strains in Box 20: ${strains[0].count}`);
        } else {
            console.log(`Box ID ${testId} not found in names table.`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

findPopulatedBox();
