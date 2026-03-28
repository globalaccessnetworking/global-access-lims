const { sequelize } = require('./models');

async function diag() {
    try {
        const [columns] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ext_bacterial_strains'
        `);
        console.log('Columns for ext_bacterial_strains:', JSON.stringify(columns, null, 2));

        const [records] = await sequelize.query('SELECT * FROM "ext_bacterial_strains" LIMIT 5');
        console.log('Sample Records:', JSON.stringify(records, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
diag();
