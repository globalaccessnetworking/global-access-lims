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

        const [admin, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                email: 'admin@globalaccess.com',
                password_hash: hashedPassword,
                role: 'Admin',
                permissions: { library: 'write', inventory: 'write', storage: 'write', entry: 'write' }
            }
        });

        if (created) {
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists. Updating password and permissions...');
            admin.password_hash = hashedPassword;
            admin.role = 'Admin';
            admin.permissions = { library: 'write', inventory: 'write', storage: 'write', entry: 'write' };
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
