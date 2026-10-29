const { sequelize } = require('./server/models');
async function test() {
    try {
        const rows = await sequelize.query(`SELECT column_default FROM information_schema.columns WHERE table_name = 'ext_bacterial_strains' AND column_name = 'id'`);
        console.log('DEFAULT:', rows[0][0].column_default);
    } catch(err) {
        console.log(err);
    }
}
test();
