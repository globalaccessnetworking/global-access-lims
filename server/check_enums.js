const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function checkEnums() {
    try {
        const enums = await sequelize.query(`
            SELECT t.typname AS enum_name, e.enumlabel AS enum_value
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            ORDER BY enum_name, e.enumsortorder;
        `, { type: QueryTypes.SELECT });

        console.log(JSON.stringify(enums, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkEnums();
