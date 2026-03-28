const sequelize = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const resetAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const [user, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                email: 'admin@lims.local',
                password_hash: hashedPassword,
                role: 'Admin'
            }
        });

        if (!created) {
            user.password_hash = hashedPassword;
            user.role = 'Admin'; // Ensure role is correct
            await user.save();
            console.log('Admin password reset to: admin123');
        } else {
            console.log('Admin user created with password: admin123');
        }

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await sequelize.close();
        process.exit();
    }
};

resetAdmin();
