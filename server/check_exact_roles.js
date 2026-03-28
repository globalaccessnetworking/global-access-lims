const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function checkExactEnums() {
    try {
        const results = await sequelize.query(`
            SELECT n.nspname as schema, t.typname as type, e.enumlabel as value
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE t.typname = 'enum_Users_role'
            ORDER BY e.enumsortorder;
        `, { type: QueryTypes.SELECT });

        console.log('--- Current enum_Users_role values ---');
        console.table(results);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkExactEnums();
