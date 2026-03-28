const { sequelize } = require('../models');

const updateDatabase = async () => {
    try {
        console.log('Syncing database with model changes...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database schema updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database sync failed:', err.message);
        process.exit(1);
    }
};

updateDatabase();
