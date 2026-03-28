const { sequelize, User, Notification } = require('./models');

async function debugStudent() {
    try {
        const student = await User.findOne({ where: { username: 'student' } });
        if (!student) {
            console.log('Student user not found');
            process.exit(1);
        }
        console.log(`Debug for User: ${student.username} (ID: ${student.id})`);

        // 1. Check Tasks
        const [tasks] = await sequelize.query(`
            SELECT id, title, status, assigned_to_id 
            FROM ext_lab_tasks 
            WHERE assigned_to_id = :id
        `, { replacements: { id: student.id } });
        console.log('Tasks assigned to student:', JSON.stringify(tasks, null, 2));

        // 2. Check Notifications for student
        const notifications = await Notification.findAll({
            where: { user_id: student.id }
        });
        console.log('Notifications for student:', JSON.stringify(notifications, null, 2));

        // 3. Check System-wide notifications
        const systemNotif = await Notification.findAll({
            where: { user_id: null }
        });
        console.log('System notifications (user_id null):', JSON.stringify(systemNotif, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
debugStudent();
