require('dotenv').config({ path: '.env' }); // Force path
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
    }
);

async function inspect() {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB.");

        // 1. List ext_ tables
        const [results] = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ext_%';"
        );
        console.log("Found tables:", results.map(r => r.table_name));

        const tablesToCheck = ['ext_bacterial_strains', 'ext_lab_stock', 'ext_bacteriophages'];

        for (const tableName of tablesToCheck) {
            try {
                const [rows] = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 1`);
                if (rows.length > 0) {
                    console.log(`\nColumns for ${tableName}:`, Object.keys(rows[0]));
                } else {
                    console.log(`\nTable ${tableName} is empty.`);
                    // If empty, we can't get columns easily from SELECT *
                    // Fallback to information_schema
                    const [columns] = await sequelize.query(
                        `SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}';`
                    );
                    console.log(`Schema columns for ${tableName}:`, columns.map(c => c.column_name));
                }
            } catch (e) {
                console.error(`Error querying ${tableName}:`, e.message);
            }
        }

    } catch (e) {
        console.error("Fatal Error:", e);
    } finally {
        await sequelize.close();
    }
}

inspect();
