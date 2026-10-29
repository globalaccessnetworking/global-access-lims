const { sequelize } = require('./server/models');
async function test() {
    try {
        const rows = await sequelize.query(`SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'ext_bacterial_strains' AND constraint_type = 'UNIQUE'`);
        console.log('UNIQUE CONSTRAINTS:', rows[0]);
    } catch(err) {
        console.log(err);
    }
}
test();
