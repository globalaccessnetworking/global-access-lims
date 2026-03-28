const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugMagnetID() {
    try {
        await sequelize.authenticate();
        console.log("DB Connected.");

        const boxName = 'Rabia-2';
        console.log(`Searching for Box Name: "${boxName}"`);

        // 1. Get ID
        const boxRec = await sequelize.query(
            `SELECT "ID", "Box_detail" FROM "ext_location_detail_box_name" WHERE "Box_detail" = :boxName`,
            { replacements: { boxName }, type: QueryTypes.SELECT }
        );

        if (boxRec.length === 0) {
            console.log("Box Name not found in ext_location_detail_box_name");
            return;
        }

        const boxId = boxRec[0].ID;
        console.log(`Found Box ID: ${boxId}`);

        // 2. Search Strains with ID
        const strains = await sequelize.query(
            `SELECT "Strain_No", "GS_Box_details" FROM "ext_bacterial_strains" WHERE CAST("GS_Box_details" AS VARCHAR) = CAST(:boxId AS VARCHAR) LIMIT 5`,
            { replacements: { boxId }, type: QueryTypes.SELECT }
        );
        console.log(`Strains Found with ID ${boxId}:`, strains);

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugMagnetID();
