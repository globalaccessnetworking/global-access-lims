const { sequelize } = require('./models');

async function check() {
    try {
        const [sl] = await sequelize.query('SELECT box, position FROM "StorageLocations" LIMIT 20');
        console.log("StorageLocations (first 20):", JSON.stringify(sl, null, 2));

        const [s] = await sequelize.query('SELECT "GS_Box_details", "Location_in_Box_GS", "Strain_No" FROM "ext_bacterial_strains" WHERE "Strain_No" IS NOT NULL AND "Strain_No" != \'\' LIMIT 10');
        console.log("Ext Strains (non-empty):", JSON.stringify(s, null, 2));

        const [p] = await sequelize.query('SELECT "GS_Box_details", "GS_position_in_Box", "Bacteriophage_Name" FROM "ext_bacteriophages" WHERE "Bacteriophage_Name" IS NOT NULL AND "Bacteriophage_Name" != \'\' LIMIT 10');
        console.log("Ext Phages (non-empty):", JSON.stringify(p, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
