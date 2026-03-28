const { sequelize } = require('./models');

async function check() {
    try {
        const [results] = await sequelize.query(`
            SELECT ba.id as ba_id, ba.strain_number as ba_sn, s."Strain_No" as real_sn, s."Specie" as real_specie
            FROM "BiologicalAssets" ba
            JOIN "StorageLocations" sl ON ba.storage_location_id = sl.id
            JOIN "ext_bacterial_strains" s ON sl.box = s."GS_Box_details" AND sl.position = s."Location_in_Box_GS"
            WHERE s."Strain_No" IS NOT NULL AND s."Strain_No" != ''
            LIMIT 5
        `);
        console.log("STRAINS MATCHES:", JSON.stringify(results, null, 2));

        const [resultsPhage] = await sequelize.query(`
            SELECT ba.id as ba_id, ba.strain_number as ba_sn, p."Bacteriophage_Name" as real_sn
            FROM "BiologicalAssets" ba
            JOIN "StorageLocations" sl ON ba.storage_location_id = sl.id
            JOIN "ext_bacteriophages" p ON sl.box = p."GS_Box_details" AND sl.position = p."GS_position_in_Box"
            WHERE p."Bacteriophage_Name" IS NOT NULL AND p."Bacteriophage_Name" != ''
            LIMIT 5
        `);
        console.log("PHAGES MATCHES:", JSON.stringify(resultsPhage, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
