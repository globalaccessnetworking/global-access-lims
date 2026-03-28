const { sequelize } = require('./models');

async function extractEnums() {
    try {
        console.log('--- Scanning ENUMs for Dynamic Tables ---');

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

        const enums = {};
        rows.forEach(row => {
            if (!enums[row.enum_name]) enums[row.enum_name] = [];
            enums[row.enum_name].push(row.enum_value);
        });

        console.log('ENUM_MAP:', JSON.stringify(enums, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Extraction failed:', err.message);
        process.exit(1);
    }
}

extractEnums();
