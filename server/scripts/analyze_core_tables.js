const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function analyzeTables() {
    try {
        const tables = ['ext_plasmids', 'ext_lab_stock_primer', 'ext_bacterial_strains'];
        for (const t of tables) {
            console.log(`\n--- ANALYSIS OF ${t} ---`);
            const [cols] = await sequelize.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${t}' 
                ORDER BY ordinal_position;
            `);
            console.table(cols);

            const [sample] = await sequelize.query(`SELECT * FROM "${t}" LIMIT 1`);
            console.log("Sample Record:", JSON.stringify(sample[0], null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

analyzeTables();
