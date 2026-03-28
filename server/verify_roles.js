const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function verify() {
    try {
        const [results] = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'enum_Users_role'
        `);
        console.log('--- FINAL DB ROLES ---');
        console.log(results.map(r => r.enumlabel).join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}
verify();
