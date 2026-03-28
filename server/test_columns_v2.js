require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');
const fs = require('fs');

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
    let output = '';
    const log = (msg) => { console.log(msg); output += msg + '\n'; };

    try {
        await sequelize.authenticate();
        log("DB Connected.");

        const check = async (table, col) => {
            try {
                await sequelize.query(`SELECT "${col}" FROM "${table}" LIMIT 1`);
                log(`[PASS] ${table}.${col}`);
            } catch (e) {
                // log(`[FAIL] ${table}.${col}`);
            }
        };

        log("--- Bacterial Strains ---");
        await check('ext_bacterial_strains', 'Strain_Name');
        await check('ext_bacterial_strains', 'strain_name'); // lowecase check
        await check('ext_bacterial_strains', 'Species');
        await check('ext_bacterial_strains', 'species');
        await check('ext_bacterial_strains', 'Designation');
        await check('ext_bacterial_strains', 'designation');

        log("--- Lab Stock ---");
        await check('ext_lab_stock', 'Item_Name');
        await check('ext_lab_stock', 'item_name');
        await check('ext_lab_stock', 'Catalog_Number');
        await check('ext_lab_stock', 'Quantity');
        await check('ext_lab_stock', 'quantity');
        await check('ext_lab_stock', 'Available_Quantity');
        await check('ext_lab_stock', 'available_quantity');

        log("--- Bacteriophages ---");
        await check('ext_bacteriophages', 'Phage_Name');
        await check('ext_bacteriophages', 'phage_name');
        await check('ext_bacteriophages', 'Phage_ID');
        await check('ext_bacteriophages', 'phage_id');
        await check('ext_bacteriophages', 'Name');

        fs.writeFileSync('columns_found.txt', output);

    } catch (e) {
        log("Setup Error: " + e.message);
        fs.writeFileSync('columns_found.txt', output);
    } finally {
        await sequelize.close();
    }
}

test();
