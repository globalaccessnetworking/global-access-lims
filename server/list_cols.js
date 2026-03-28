const { sequelize } = require('./models');

async function check() {
    try {
        const [cols] = await sequelize.query("SELECT * FROM information_schema.columns WHERE table_name = 'ext_lab_projects'");
        cols.forEach(c => {
            console.log(`${c.column_name}: ${c.is_nullable}, ${c.data_type}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
