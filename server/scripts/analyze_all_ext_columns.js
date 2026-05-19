const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', process.env.DB_PASSWORD || 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function analyzeAllColumns() {
    try {
        const [results] = await sequelize.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'ext_%'
            ORDER BY table_name, ordinal_position;
        `);
        
        const tables = {};
        results.forEach(r => {
            if (!tables[r.table_name]) tables[r.table_name] = [];
            tables[r.table_name].push(r.column_name);
        });

        console.log(JSON.stringify(tables, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

analyzeAllColumns();
