const { sequelize, User } = require('./models');

async function diag() {
    try {
        const student = await User.findOne({ where: { username: 'student' } });
        console.log('Student User:', student ? { id: student.id, username: student.username } : 'NOT FOUND');

        if (student) {
            const [tasks] = await sequelize.query("SELECT * FROM ext_lab_tasks WHERE assigned_to_id = :userId", {
                replacements: { userId: student.id }
            });
            console.log('Tasks for Student:', JSON.stringify(tasks, null, 2));
        }

        const [allTasks] = await sequelize.query("SELECT * FROM ext_lab_tasks LIMIT 5");
        console.log('Sample Tasks:', JSON.stringify(allTasks, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
diag();
