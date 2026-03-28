const sequelize = require('./config/database');
const { User } = require('./models');

async function testCreate() {
    try {
        console.log('Attempting to create a test Student user...');
        const user = await User.create({
            username: 'test_student_' + Date.now(),
            password_hash: 'dummy_hash',
            role: 'Student',
            permissions: { library: 'read', qr_read: 'read' }
        });
        console.log('SUCCESS: User created with ID:', user.id);

        // Cleanup
        await user.destroy();
        console.log('Cleanup: Test user deleted.');

    } catch (err) {
        console.error('FAILURE during test creation:');
        console.error(err.name, err.message);
        if (err.errors) console.error(err.errors.map(e => e.message));
    } finally {
        await sequelize.close();
    }
}
testCreate();
