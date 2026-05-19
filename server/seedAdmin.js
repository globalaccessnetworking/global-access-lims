const { User } = require('./models');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Force sync to ensure columns exist
        await User.sync({ alter: true });
        console.log('User table synced.');

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const defaults = {
            username: 'admin',
            email: 'admin@globalaccess.com',
            password_hash: hashedPassword,
            role: 'Admin',
            permissions: { library: 'write', inventory: 'write', storage: 'write', entry: 'write' },
            security_question_1: 'What was the name of your first laboratory or department?',
            security_answer_1: 'phagelab',
            security_question_2: 'What is the last name of your first scientific supervisor or mentor?',
            security_answer_2: 'shafiq'
        };

        const [admin, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults
        });

        if (created) {
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists. Updating password, permissions, and security questions...');
            admin.password_hash = hashedPassword;
            admin.role = 'Admin';
            admin.permissions = { library: 'write', inventory: 'write', storage: 'write', entry: 'write' };
            admin.security_question_1 = defaults.security_question_1;
            admin.security_answer_1 = defaults.security_answer_1;
            admin.security_question_2 = defaults.security_question_2;
            admin.security_answer_2 = defaults.security_answer_2;
            await admin.save();
            console.log('Admin updated.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedAdmin();
