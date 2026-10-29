const { sequelize } = require('./models');
async function test() {
    const rows = await sequelize.query(`SELECT COUNT(*) as c FROM ext_bacterial_strains WHERE "Strain_No" = 'MSA-123'`);
    console.log('COUNT:', rows[0][0].c);
}
test();
