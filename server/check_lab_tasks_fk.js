const sequelize = require('./config/database');
const { Sequelize } = require('sequelize');

async function checkFKs() {
    try {
        const query = `
            SELECT
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'ext_lab_tasks';
        `;
        const [rows] = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
        console.log('FOREIGN KEYS FOR ext_lab_tasks:', JSON.stringify(rows, null, 2));

        for (const row of rows) {
            const countQuery = `SELECT COUNT(*) FROM "${row.foreign_table_name}"`;
            const [countResult] = await sequelize.query(countQuery, { type: Sequelize.QueryTypes.SELECT });
            console.log(`Count in ${row.foreign_table_name}:`, countResult);

            const sampleQuery = `SELECT * FROM "${row.foreign_table_name}" LIMIT 5`;
            const [samples] = await sequelize.query(sampleQuery, { type: Sequelize.QueryTypes.SELECT });
            console.log(`Samples from ${row.foreign_table_name}:`, samples);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

checkFKs();
