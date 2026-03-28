require('dotenv').config({ path: '.env' });
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

async function test() {
    try {
        await sequelize.authenticate();
        console.log("DB Connected.");

        const check = async (table, col) => {
            try {
                await sequelize.query(`SELECT "${col}" FROM "${table}" LIMIT 1`);
                console.log(`[PASS] ${table}.${col}`);
            } catch (e) {
                console.log(`[FAIL] ${table}.${col} - ${e.message.split('\n')[0]}`);
            }
        };

        console.log("--- Testing bacterial_strains ---");
        await check('ext_bacterial_strains', 'Strain_Name');
        await check('ext_bacterial_strains', 'strain_name');
        await check('ext_bacterial_strains', 'Species');
        await check('ext_bacterial_strains', 'species');
        await check('ext_bacterial_strains', 'Designation');

        console.log("--- Testing lab_stock ---");
        await check('ext_lab_stock', 'Item_Name');
        await check('ext_lab_stock', 'item_name');
        await check('ext_lab_stock', 'Quantity');
        await check('ext_lab_stock', 'quantity');
        await check('ext_lab_stock', 'available_quantity');
        await check('ext_lab_stock', 'Available_Quantity');

        console.log("--- Testing bacteriophages ---");
        await check('ext_bacteriophages', 'Phage_Name');
        await check('ext_bacteriophages', 'phage_name');
        await check('ext_bacteriophages', 'Phage_ID');

    } catch (e) {
        console.error("Setup Error:", e);
    } finally {
        await sequelize.close();
    }
}

test();
