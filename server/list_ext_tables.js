const { sequelize } = require('./models');

async function run() {
    try {
        const [rows] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'ext_%'
        `);
        console.log('TABLES:', rows.map(r => r.table_name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
