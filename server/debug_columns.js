const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function checkColumns(tableName) {
    try {
        const schemaQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `;
        const columns = await sequelize.query(schemaQuery, {
            type: Sequelize.QueryTypes.SELECT
        });
        console.log(`Columns for ${tableName}:`, JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

const table = process.argv[2] || 'ext_lab_projects';
checkColumns(table);
