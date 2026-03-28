const { sequelize } = require('./models');

async function check() {
    try {
        const [slSample] = await sequelize.query('SELECT box, position FROM "StorageLocations" LIMIT 1');
        const [extSample] = await sequelize.query('SELECT "GS_Box_details", "GS_position_in_Box" FROM "ext_bacterial_strains" LIMIT 1');
        console.log("StorageLocation Sample:", slSample[0]);
        console.log("Ext Strain Sample:", extSample[0]);

        const [results] = await sequelize.query(`
            SELECT ba.id as ba_id, ba.strain_number as ba_sn, s."Strain_No" as real_sn
            FROM "BiologicalAssets" ba
            JOIN "StorageLocations" sl ON ba.storage_location_id = sl.id
            JOIN "ext_bacterial_strains" s ON sl.box = s."GS_Box_details" AND sl.position = s."GS_position_in_Box"
            LIMIT 5
        `);
        console.log("STRAINS MATCHES:", results);

        const [resultsPhage] = await sequelize.query(`
            SELECT ba.id as ba_id, ba.strain_number as ba_sn, p."Bacteriophage_Name" as real_sn
            FROM "BiologicalAssets" ba
            JOIN "StorageLocations" sl ON ba.storage_location_id = sl.id
            JOIN "ext_bacteriophages" p ON sl.box = p."GS_Box_details" AND sl.position = p."GS_position_in_Box"
            LIMIT 5
        `);
        console.log("PHAGES MATCHES:", resultsPhage);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
