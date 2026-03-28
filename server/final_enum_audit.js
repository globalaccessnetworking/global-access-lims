const { sequelize } = require('./models');

async function run() {
    try {
        console.log('--- ENUM AUDIT ---');
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

        // Group by enum name
        const enumMap = {};
        rows.forEach(r => {
            if (!enumMap[r.enum_name]) enumMap[r.enum_name] = [];
            enumMap[r.enum_name].push(r.enum_value);
        });

        console.log('ENUM_DATA_START');
        console.log(JSON.stringify(enumMap, null, 2));
        console.log('ENUM_DATA_END');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
