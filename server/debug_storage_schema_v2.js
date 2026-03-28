const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugSchema() {
    try {
        await sequelize.authenticate();

        // 1. StorageLocations Data Type
        const sl = await sequelize.query(
            `SELECT freezer_name, box, rack FROM "StorageLocations" LIMIT 3`,
            { type: QueryTypes.SELECT }
        );
        console.log("SL Sample:", JSON.stringify(sl, null, 2));

        // 2. Primer Columns
        const primers = await sequelize.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'ext_primers_details'`,
            { type: QueryTypes.SELECT }
        );
        console.log("Primer Cols:", JSON.stringify(primers.map(c => c.column_name)));

        // 3. Phage Columns
        const phages = await sequelize.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'ext_bacteriophages'`,
            { type: QueryTypes.SELECT }
        );
        console.log("Phage Cols:", JSON.stringify(phages.map(c => c.column_name)));

        // 4. Strain Columns
        const strains = await sequelize.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'ext_bacterial_strains'`,
            { type: QueryTypes.SELECT }
        );
        console.log("Strain Cols:", JSON.stringify(strains.map(c => c.column_name)));

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugSchema();
