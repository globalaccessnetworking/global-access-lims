const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function checkSchema() {
    try {
        const tableInfo = await sequelize.query(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'Users'",
            { type: QueryTypes.SELECT }
        );
        console.log('--- Users Table Info ---');
        console.table(tableInfo);

        // Check if it's PostgreSQL and get ENUM values if possible
        // (Assuming PostgreSQL based on previous interactions)
        const enumInfo = await sequelize.query(
            "SELECT n.nspname as schema, t.typname as type, e.enumlabel as value " +
            "FROM pg_enum e " +
            "JOIN pg_type t ON e.enumtypid = t.oid " +
            "JOIN pg_namespace n ON t.typnamespace = n.oid",
            { type: QueryTypes.SELECT }
        );
        console.log('--- Enum Info ---');
        console.table(enumInfo.filter(e => e.type.includes('role') || e.type.includes('enum')));

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
