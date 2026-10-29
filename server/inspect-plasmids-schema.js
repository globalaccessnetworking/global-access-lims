const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function inspectPlasmidsSchema() {
    try {
        console.log('=== ext_plasmids columns ===');
        const desc = await sequelize.getQueryInterface().describeTable('ext_plasmids');
        console.log(Object.keys(desc));

        console.log('\n=== Latest 5 rows in ext_plasmids ===');
        const rows = await sequelize.query(`SELECT * FROM ext_plasmids ORDER BY id DESC LIMIT 5`, { type: Sequelize.QueryTypes.SELECT });
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

inspectPlasmidsSchema();
