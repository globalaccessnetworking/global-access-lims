const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugMagnetID() {
    try {
        await sequelize.authenticate();
        console.log("DB Connected.");

        const boxId = 49; // Rabia-2
        console.log(`Checking Phages for Box ID: ${boxId}`);
        const phages = await sequelize.query(
            `SELECT "Bacteriophage_Name", "GS_Box_details" FROM "ext_bacteriophages" WHERE CAST("GS_Box_details" AS VARCHAR) = CAST(:boxId AS VARCHAR) LIMIT 5`,
            { replacements: { boxId }, type: QueryTypes.SELECT }
        );
        console.log(`Phages Found:`, phages);

        const testId = 20;
        console.log(`\nChecking Box Name for ID: ${testId}`);
        const boxNameRec = await sequelize.query(
            `SELECT "Box_detail" FROM "ext_location_detail_box_name" WHERE "ID" = :testId`,
            { replacements: { testId }, type: QueryTypes.SELECT }
        );
        console.log("Box Name:", boxNameRec);

        console.log(`Checking Strains for Box ID: ${testId}`);
        const testStrains = await sequelize.query(
            `SELECT "Strain_No", "Location_in_Box_GS" FROM "ext_bacterial_strains" WHERE CAST("GS_Box_details" AS VARCHAR) = CAST(:testId AS VARCHAR) LIMIT 5`,
            { replacements: { testId }, type: QueryTypes.SELECT }
        );
        console.log("Strains:", testStrains);

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugMagnetID();
