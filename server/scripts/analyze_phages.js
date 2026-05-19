const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function analyzeBacteriophages() {
    try {
        console.log("--- ANALYSIS OF ext_bacteriophages (RAW MS ACCESS) ---");
        const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ext_bacteriophages' 
            ORDER BY ordinal_position;
        `);
        console.table(results);

        console.log("\n--- SAMPLE DATA FROM ext_bacteriophages ---");
        const [sample] = await sequelize.query(`SELECT * FROM "ext_bacteriophages" LIMIT 1`);
        console.log(JSON.stringify(sample, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

analyzeBacteriophages();
