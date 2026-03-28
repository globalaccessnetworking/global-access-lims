const { sequelize } = require('./models');

async function diag() {
    try {
        const [projects] = await sequelize.query("SELECT id, name, status FROM ext_lab_projects");
        console.log('Projects:', JSON.stringify(projects, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
diag();
