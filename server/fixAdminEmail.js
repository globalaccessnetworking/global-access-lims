const { User } = require('./models');
const sequelize = require('./config/database');

const fix = async () => {
    try {
        await sequelize.authenticate();
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (admin) {
            console.log(`Found Admin. Current Email: ${admin.email}`);
            admin.email = 'admin@globalaccess.com';
            await admin.save();
            console.log(`✅ Updated Admin Email to: ${admin.email}`);
        } else {
            console.log('❌ Admin not found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fix();
