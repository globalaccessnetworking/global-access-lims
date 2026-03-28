const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugMagnet() {
    try {
        await sequelize.authenticate();
        console.log("DB Connected.");

        const box = 'Rabia-2';
        console.log(`Searching for box: "${box}"`);

        // Check exact match in ext_bacterial_strains
        const strains = await sequelize.query(
            `SELECT "Strain_No", "GS_Box_details", "Location_in_Box_GS" FROM "ext_bacterial_strains" WHERE "GS_Box_details" = :box`,
            { replacements: { box }, type: QueryTypes.SELECT }
        );
        console.log(`Strains Found: ${strains.length}`);
        if (strains.length > 0) console.log(strains[0]);

        // Check if ANY box contains 'Rabia'
        const fuzzy = await sequelize.query(
            `SELECT DISTINCT "GS_Box_details" FROM "ext_bacterial_strains" WHERE "GS_Box_details" LIKE '%Rabia%' LIMIT 5`,
            { type: QueryTypes.SELECT }
        );
        console.log("Fuzzy Match Strains:", fuzzy);

        // Run the UNION query
        const query = `
            SELECT * FROM (
                SELECT 'strain' as type, "Strain_No" as name, "GS_Box_details" as box FROM "ext_bacterial_strains" WHERE "GS_Box_details" = :box
                UNION ALL
                SELECT 'phage' as type, "Bacteriophage_Name" as name, "GS_Box_details" as box FROM "ext_bacteriophages" WHERE "GS_Box_details" = :box
                UNION ALL
                SELECT 'primer' as type, "Primer_Name" as name, "Box_detail" as box FROM "ext_primers_details" WHERE "Box_detail" = :box
            ) as unified_assets
        `;

        const unified = await sequelize.query(query, {
            replacements: { box }, type: QueryTypes.SELECT
        });
        console.log(`Unified Results: ${unified.length}`);

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugMagnet();
