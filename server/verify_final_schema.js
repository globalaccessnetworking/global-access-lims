const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function verifyFinalSchema() {
    const tableName = 'ext_lab_tasks';
    console.log('--- FINAL SCHEMA VERIFICATION ---');

    // Helper functions from system.js logic
    async function getForeignKeys(tn) {
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
        const [rows] = await sequelize.query(query, { bind: [tn], type: Sequelize.QueryTypes.SELECT });
        return rows;
    }

    async function getForeignKeyOptions(foreignTable, foreignCol) {
        try {
            const cleanTable = foreignTable.replace(/"/g, '');
            const [cols] = await sequelize.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
            `, { bind: [cleanTable], type: Sequelize.QueryTypes.SELECT });
            const colNames = cols.map(c => c.column_name.toLowerCase());
            let labelCol = foreignCol;
            const candidates = ['name', 'full_name', 'title', 'username', 'display_name', 'email', 'description'];
            for (const cand of candidates) {
                if (colNames.includes(cand)) { labelCol = cand; break; }
            }
            return await sequelize.query(`SELECT "${foreignCol}" as value, "${labelCol}" as label FROM "${cleanTable}" LIMIT 10`, { type: Sequelize.QueryTypes.SELECT });
        } catch (e) { return []; }
    }

    const fks = await getForeignKeys(tableName);
    console.log('Detected FKs:', fks);

    const description = await sequelize.getQueryInterface().describeTable(tableName);
    let schema = [];

    for (const key of Object.keys(description)) {
        const col = description[key];
        const fk = fks.find(f => f.column_name === key);
        let item = { key, type: 'text' };

        if (fk) {
            item.type = 'select';
            item.options = await getForeignKeyOptions(fk.foreign_table_name, fk.foreign_column_name);
        }
        schema.push(item);
    }

    console.log('Final Schema Sample:', schema.filter(s => ['project_id', 'assigned_to_id'].includes(s.key)));
    process.exit();
}

verifyFinalSchema();
