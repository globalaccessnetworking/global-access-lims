require('dotenv').config({ path: '.env' });
const { Sequelize, QueryTypes } = require('sequelize');

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

        console.log("--- Dashboard Logic ---");

        // 1. Strains
        try {
            await sequelize.query(`SELECT COUNT(*) as count FROM "ext_bacterial_strains"`, { type: QueryTypes.SELECT });
            console.log("Strains: OK");
        } catch (e) { console.log("Strains FAIL:", e.message); }

        // 2. Phages
        try {
            await sequelize.query(`SELECT COUNT(*) as count FROM "ext_bacteriophages"`, { type: QueryTypes.SELECT });
            console.log("Phages: OK");
        } catch (e) { console.log("Phages FAIL:", e.message); }

        // 3. Stock
        try {
            await sequelize.query(`SELECT COUNT(*) as count FROM "ext_lab_stock"`, { type: QueryTypes.SELECT });
            console.log("Stock: OK");
        } catch (e) { console.log("Stock FAIL:", e.message); }

        // 4. Low Stock
        try {
            await sequelize.query(`SELECT COUNT(*) as count FROM "ext_lab_stock" WHERE "Available_Quantity"::numeric < 5`, { type: QueryTypes.SELECT });
            console.log("Low Stock: OK");
        } catch (e) {
            console.log("Low Stock FAIL:", e.message);
            // Try without cast
            try {
                await sequelize.query(`SELECT COUNT(*) as count FROM "ext_lab_stock" WHERE "Available_Quantity" < 5`, { type: QueryTypes.SELECT });
                console.log("Low Stock (No Cast): OK");
            } catch (e2) { console.log("Low Stock (No Cast) FAIL:", e2.message); }
        }

        // 5. Species
        try {
            await sequelize.query(`SELECT "Specie" as species, COUNT(*) as count FROM "ext_bacterial_strains" GROUP BY "Specie" ORDER BY count DESC LIMIT 5`, { type: QueryTypes.SELECT });
            console.log("Species: OK");
        } catch (e) { console.log("Species FAIL:", e.message); }

        console.log("--- Search Logic ---");
        const term = '%a%';

        // 1. Strains
        try {
            await sequelize.query(`SELECT * FROM "ext_bacterial_strains" WHERE "Strain_No" ILIKE :term LIMIT 5`, { replacements: { term }, type: QueryTypes.SELECT });
            console.log("Search Strains: OK");
        } catch (e) { console.log("Search Strains FAIL:", e.message); }

        // 2. Inventory
        try {
            await sequelize.query(`SELECT * FROM "ext_lab_stock" WHERE "Item_Name" ILIKE :term LIMIT 5`, { replacements: { term }, type: QueryTypes.SELECT });
            console.log("Search Inventory: OK");
        } catch (e) { console.log("Search Inventory FAIL:", e.message); }

        // 3. Phages
        try {
            await sequelize.query(`SELECT * FROM "ext_bacteriophages" WHERE "Bacteriophage_Name" ILIKE :term LIMIT 5`, { replacements: { term }, type: QueryTypes.SELECT });
            console.log("Search Phages: OK");
        } catch (e) { console.log("Search Phages FAIL:", e.message); }

    } catch (e) {
        console.error("Setup Error:", e);
    } finally {
        await sequelize.close();
    }
}

test();
