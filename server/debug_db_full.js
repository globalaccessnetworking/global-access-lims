const sequelize = require('./config/database');
const { Sequelize } = require('sequelize');

async function debugDatabase() {
    try {
        console.log('--- ALL TABLES ---');
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        console.log(tables.map(t => t.table_name).join(', '));

        console.log('--- FK QUERY TEST ---');
        const tableName = 'ext_lab_tasks';
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
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = :tableName;
        `;
        const fks = await sequelize.query(query, {
            replacements: { tableName },
            type: Sequelize.QueryTypes.SELECT
        });
        console.log('Detected FKs:', fks);

        for (const fk of fks) {
            console.log(`Checking options for ${fk.column_name} -> ${fk.foreign_table_name}`);
            const [options] = await sequelize.query(`SELECT * FROM "${fk.foreign_table_name}" LIMIT 5`);
            console.log(`Options available:`, options.length);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

debugDatabase();
