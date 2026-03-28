const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');

async function inspect() {
    try {
        await sequelize.authenticate();
        console.log("Connected.");

        // 1. List ext_ tables
        const tables = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ext_%';",
            { type: QueryTypes.SELECT }
        );
        console.log("Tables:", tables.map(t => t.table_name));

        // 2. Inspect ext_bacterial_strains columns
        if (tables.find(t => t.table_name === 'ext_bacterial_strains')) {
            const strains = await sequelize.query(
                `SELECT * FROM "ext_bacterial_strains" LIMIT 1`,
                { type: QueryTypes.SELECT }
            );
            console.log("Strains Columns:", strains.length ? Object.keys(strains[0]) : "Empty Table");
        }

        // 3. Inspect ext_lab_stock columns
        if (tables.find(t => t.table_name === 'ext_lab_stock')) {
            const stock = await sequelize.query(
                `SELECT * FROM "ext_lab_stock" LIMIT 1`,
                { type: QueryTypes.SELECT }
            );
            console.log("Stock Columns:", stock.length ? Object.keys(stock[0]) : "Empty Table");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sequelize.close();
    }
}

inspect();
