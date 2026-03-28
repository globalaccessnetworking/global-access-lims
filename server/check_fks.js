const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function diagnostic() {
    try {
        const tableName = 'ext_experiment_comments';
        console.log(`--- DIAGNOSTIC FOR ${tableName} ---`);

        const query = `
            SELECT
                a.attname AS column_name,
                confrelid::regclass::text AS foreign_table_name,
                af.attname AS foreign_column_name
            FROM pg_constraint AS c
            JOIN pg_attribute AS a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
            JOIN pg_attribute AS af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
            WHERE c.contype = 'f' AND conrelid = $1::regclass;
        `;
        const fks = await sequelize.query(query, { bind: [tableName], type: Sequelize.QueryTypes.SELECT });
        console.log('Foreign Keys found:', JSON.stringify(fks, null, 2));

        for (const fk of fks) {
            console.log(`\n--- OPTIONS FOR ${fk.column_name} (Remote Table: ${fk.foreign_table_name}) ---`);
            const cleanTable = fk.foreign_table_name.replace(/"/g, '');

            const cols = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
            `, { bind: [cleanTable], type: Sequelize.QueryTypes.SELECT });

            console.log('Columns in remote table:', cols.map(c => c.column_name));

            const [rows] = await sequelize.query(`SELECT COUNT(*) FROM "${cleanTable}"`);
            console.log('Row count in remote table:', rows[0].count);
        }

    } catch (e) {
        console.error('DIAGNOSTIC ERROR:', e.message);
    } finally {
        await sequelize.close();
    }
}

diagnostic();
