const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function checkIndexes() {
    try {
        const rows = await sequelize.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ext_bacterial_strains'`);
        console.log(rows[0]);
    } catch(err) {
        console.error(err);
    }
}
checkIndexes();
