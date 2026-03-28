const { Sequelize } = require('sequelize');
const sequelize = require('./config/database');
const { StorageLocation } = require('./models');

async function inspectData() {
    try {
        await sequelize.authenticate();

        // Check first 5 rows
        const rows = await StorageLocation.findAll({
            limit: 5,
            attributes: ['id', 'box', 'freezer_name', 'rack', 'position']
        });
        console.log("FIRST 5 ROWS:");
        console.log(JSON.stringify(rows, null, 2));

        // Check if ANY rows have freezer_name
        const count = await StorageLocation.count({
            where: {
                freezer_name: { [Sequelize.Op.ne]: null }
            }
        });
        console.log(`Rows with non-null freezer_name: ${count}`);

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

inspectData();
