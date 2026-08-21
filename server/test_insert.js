const { sequelize } = require('./models');
async function test() {
    try {
        await sequelize.query('INSERT INTO ext_bacterial_strains ("Strain_No", "ID") VALUES (\'TEST-999\', \'Enter ID...\')');
        console.log('Insert successful');
    } catch(err) {
        console.log('MSG:', err.message);
        console.log('ERRORS:', err.errors ? err.errors.map(e=>e.message) : 'none');
        console.log('DETAIL:', err.original ? err.original.detail : 'none');
    }
}
test();
