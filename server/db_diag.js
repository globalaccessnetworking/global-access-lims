const { sequelize } = require('./models');

async function checkDb() {
    try {
        console.log('--- DB Diagnostics ---');
        await sequelize.authenticate();
        console.log('Connection stable.');

        const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Public Tables:', tables.map(t => t.table_name).join(', '));

        const extTables = tables.filter(t => t.table_name.startsWith('ext_'));
        console.log('Extended Tables found:', extTables.length);

        for (const t of extTables) {
            const name = t.table_name;
            const [cols] = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${name}'`);
            console.log(`- ${name} (${cols.length} columns): ${cols.map(c => c.column_name).join(', ')}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Diagnostic error:', err);
        process.exit(1);
    }
}

checkDb();
