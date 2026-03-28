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
        console.log("DB Connected.");

        // Test Dashboard Queries
        console.log("\n--- Testing Dashboard ---");
        try {
            const strainResult = await sequelize.query(`SELECT COUNT(*) as count FROM "ext_bacterial_strains"`, { type: QueryTypes.SELECT });
            console.log("Strains Count:", strainResult[0]?.count);
        } catch (e) { console.log("Strains Error:", e.message); }

        try {
            const phageResult = await sequelize.query(`SELECT COUNT(*) as count FROM "ext_bacteriophages"`, { type: QueryTypes.SELECT });
            console.log("Phage Count:", phageResult[0]?.count);
        } catch (e) { console.log("Phage Error:", e.message); }

        try {
            const stockResult = await sequelize.query(`SELECT COUNT(*) as count FROM "ext_lab_stock"`, { type: QueryTypes.SELECT });
            console.log("Stock Count:", stockResult[0]?.count);
        } catch (e) { console.log("Stock Error:", e.message); }

        try {
            const lowStockResult = await sequelize.query(`SELECT COUNT(*) as count FROM "ext_lab_stock" WHERE "Available_Quantity"::numeric < 5`, { type: QueryTypes.SELECT });
            console.log("Low Stock:", lowStockResult[0]?.count);
        } catch (e) { console.log("Low Stock Error:", e.message); }

        try {
            const topSpecies = await sequelize.query(`SELECT "Specie" as species, COUNT(*) as count FROM "ext_bacterial_strains" GROUP BY "Specie" ORDER BY count DESC LIMIT 5`, { type: QueryTypes.SELECT });
            console.log("Top Species:", topSpecies);
        } catch (e) { console.log("Species Error:", e.message); }


        // Test Search Queries
        console.log("\n--- Testing Search ---");
        const term = '%a%';

        try {
            const strains = await sequelize.query(`SELECT * FROM "ext_bacterial_strains" WHERE "Strain_No" ILIKE :term OR "Specie" ILIKE :term LIMIT 5`, { replacements: { term }, type: QueryTypes.SELECT });
            console.log("Search Strains:", strains.length);
        } catch (e) { console.log("Search Strains Error:", e.message); }

        try {
            const inventory = await sequelize.query(`SELECT * FROM "ext_lab_stock" WHERE "Item_Name" ILIKE :term LIMIT 5`, { replacements: { term }, type: QueryTypes.SELECT });
            console.log("Search Inventory:", inventory.length);
        } catch (e) { console.log("Search Inventory Error:", e.message); }

        try {
            const phages = await sequelize.query(`SELECT * FROM "ext_bacteriophages" WHERE "Bacteriophage_Name" ILIKE :term LIMIT 5`, { replacements: { term }, type: QueryTypes.SELECT });
            console.log("Search Phages:", phages.length);
        } catch (e) { console.log("Search Phages Error:", e.message); }


    } catch (e) {
        console.error("Setup Error:", e);
    } finally {
        await sequelize.close();
    }
}

test();
