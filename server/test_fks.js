const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', 'password', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function run() {
    const fks = await sequelize.query(`
        SELECT
            tc.table_name, kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 'ext_%'
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(fks);
}
run();
