const { sequelize } = require('./models');

async function check() {
    try {
        const [projects] = await sequelize.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'ext_lab_projects'");
        console.log('Project Columns:');
        console.log(JSON.stringify(projects, null, 2));

        const [tasks] = await sequelize.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'ext_lab_tasks'");
        console.log('Task Columns:');
        console.log(JSON.stringify(tasks, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
check();
