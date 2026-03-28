const sequelize = require('./config/database');
const { Sequelize } = require('sequelize');

async function deepAudit() {
    try {
        console.log('--- DETAILED FK AUDIT ---');
        const query = `
            SELECT
                conname AS constraint_name,
                conrelid::regclass AS table_name,
                a.attname AS column_name,
                confrelid::regclass AS referenced_table,
                af.attname AS referenced_column
            FROM pg_constraint AS c
            JOIN pg_attribute AS a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
            JOIN pg_attribute AS af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
            WHERE c.contype = 'f' AND conrelid = 'ext_lab_tasks'::regclass;
        `;
        const [fks] = await sequelize.query(query);
        console.log('Active Foreign Keys:', fks);

        for (const fk of fks) {
            console.log(`Checking data for referenced table: ${fk.referenced_table}`);
            try {
                const [rows] = await sequelize.query(`SELECT * FROM ${fk.referenced_table} LIMIT 10`);
                console.log(`Contents of ${fk.referenced_table}:`, rows);
            } catch (e) {
                console.log(`Failed to read ${fk.referenced_table}:`, e.message);
            }
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

deepAudit();
