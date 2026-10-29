const { sequelize } = require('./server/models');
async function test() {
    try {
        await sequelize.query('INSERT INTO ext_bacterial_strains (id, "Strain_No") VALUES (1, \'9999\')');
    } catch(err) {
        console.log('MSG:', err.message);
        console.log('ERRORS:', err.errors ? err.errors.map(e=>e.message) : 'none');
        console.log('DETAIL:', err.original ? err.original.detail : 'none');
    }
}
test();
