const { sequelize } = require('./server/models');
async function test() {
    try {
        const rows = await sequelize.query('SELECT MAX("id") as m FROM ext_bacterial_strains');
        console.log('MAX:', rows[0][0]);
        const cols = await sequelize.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ext_bacterial_strains' AND column_name = 'id'`);
        console.log('COL TYPE:', cols[0][0]);
    } catch(err) {
        console.log(err);
    }
}
test();
