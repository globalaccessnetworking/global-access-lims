const sequelize = require('./config/database');
const { User } = require('./models');

async function syncDB() {
    try {
        console.log('Starting DB sync with { alter: true }...');
        await sequelize.sync({ alter: true });
        console.log('Check complete: User model aligned with database.');

        // Let's also verify the ENUM again to be 100% sure
        const [results] = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'enum_Users_role'
        `);
        console.log('Current Roles in DB:', results.map(r => r.enumlabel).join(', '));

    } catch (err) {
        console.error('Sync Error:', err);
    } finally {
        await sequelize.close();
    }
}

syncDB();
