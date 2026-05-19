const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', 'password', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function run() {
    const cols = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name='ext_bacterial_strains'
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(cols);
}
run();
