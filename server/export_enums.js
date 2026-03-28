const { sequelize } = require('./models');
const fs = require('fs');

async function run() {
    try {
        const [rows] = await sequelize.query(`
            SELECT 
                t.typname as enum_name,  
                e.enumlabel as enum_value
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            ORDER BY enum_name, e.enumsortorder;
        `);

        const enumMap = {};
        rows.forEach(r => {
            if (!enumMap[r.enum_name]) enumMap[r.enum_name] = [];
            enumMap[r.enum_name].push(r.enum_value);
        });

        fs.writeFileSync('enum_results.json', JSON.stringify(enumMap, null, 2));
        console.log('Results written to enum_results.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
