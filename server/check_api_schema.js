const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function getForeignKeys(tableName) {
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
    try {
        const rows = await sequelize.query(query, { bind: [tableName], type: Sequelize.QueryTypes.SELECT });
        return rows || [];
    } catch (err) {
        return [];
    }
}

async function getForeignKeyOptions(foreignTable, foreignCol) {
    try {
        const cleanTable = foreignTable.replace(/"/g, '');
        const cols = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
        `, { bind: [cleanTable], type: Sequelize.QueryTypes.SELECT });

        const colNames = cols.map(c => c.column_name.toLowerCase());
        let labelCol = foreignCol;
        const candidates = ['name', 'full_name', 'title', 'username', 'display_name', 'email', 'description', 'label'];
        for (const cand of candidates) {
            if (colNames.includes(cand)) {
                labelCol = cand;
                break;
            }
        }
        const query = `SELECT "${foreignCol}" as value, "${labelCol}" as label FROM "${cleanTable}" LIMIT 200`;
        const options = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
        return options;
    } catch (err) {
        return [];
    }
}

async function checkSchema() {
    const tableName = 'ext_experiment_comments';
    try {
        const [description, fks] = await Promise.all([
            sequelize.getQueryInterface().describeTable(tableName).catch(() => ({})),
            getForeignKeys(tableName).catch(() => [])
        ]);

        const schema = await Promise.all(Object.keys(description).map(async (key) => {
            const col = description[key];
            let item = {
                key,
                label: key.replace(/_/g, ' ').toUpperCase(),
                type: (col.type || '').toString().toLowerCase().includes('int') ? 'number' : 'text'
            };

            const fk = fks.find(f => f.column_name === key);
            if (fk) {
                item.type = 'select';
                item.options = await getForeignKeyOptions(fk.foreign_table_name, fk.foreign_column_name);
            }
            return item;
        }));

        console.log(JSON.stringify(schema, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
