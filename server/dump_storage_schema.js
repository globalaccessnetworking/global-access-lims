const { Sequelize } = require('sequelize');
const sequelize = require('./config/database');

async function dumpStorage() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'StorageLocations'"
        );
        const [results2] = await sequelize.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'BiologicalAssets'"
        );

        const fs = require('fs');
        const output = `
STORAGE LOCATIONS columns: ${JSON.stringify(results, null, 2)}

BIOLOGICAL ASSETS columns: ${JSON.stringify(results2, null, 2)}
        `;
        fs.writeFileSync('storage_schema_dump.txt', output);
        console.log("Dumped to storage_schema_dump.txt");

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

dumpStorage();
