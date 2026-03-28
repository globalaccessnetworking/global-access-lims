const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function inspectTable(tableName) {
    try {
        console.log(`--- Inspecting Table: ${tableName} ---`);

        // 1. Raw columns from information_schema
        const [rawColumns] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        console.log('Columns found:', JSON.stringify(rawColumns, null, 2));

        // 2. Sample data
        const [rows] = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 1`);
        console.log('Sample row keys:', rows.length > 0 ? Object.keys(rows[0]) : 'No data');

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err.message);
        process.exit(1);
    }
}

const table = process.argv[2] || 'ext_lab_projects';
inspectTable(table);
