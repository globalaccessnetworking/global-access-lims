/**
 * Force Reset PostgreSQL Sequences Script
 * 
 * Uses PostgreSQL native function pg_get_serial_sequence() to automatically
 * find and reset sequences for ALL tables in the database (specifically dynamic ext_* tables).
 * 
 * Sets sequence to COALESCE(MAX(pk), 0) + 1 (with is_called = false) so the very next
 * insert gets MAX + 1 cleanly without primary key collisions.
 * 
 * Run with: node server/force-reset-sequences.js
 */
const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function forceResetSequences() {
    console.log('=== Starting Native PostgreSQL Sequence Force Reset ===\n');

    try {
        // 1. Get all public tables
        const tables = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `, { type: Sequelize.QueryTypes.SELECT });

        let resetCount = 0;

        for (const { table_name } of tables) {
            try {
                // Get table column information
                const desc = await sequelize.getQueryInterface().describeTable(table_name);
                
                // Identify Primary Key column name ('id' or 'ID' or similar)
                let pkCol = Object.keys(desc).find(col => desc[col].primaryKey);
                if (!pkCol) {
                    if (desc['id']) pkCol = 'id';
                    else if (desc['ID']) pkCol = 'ID';
                }

                if (!pkCol) {
                    console.log(`  [SKIP] ${table_name}: No Primary Key column detected.`);
                    continue;
                }

                // Safely execute pg_get_serial_sequence and setval
                const seqQuery = `
                    DO $$
                    DECLARE
                        seq_name text;
                        max_val bigint;
                    BEGIN
                        seq_name := pg_get_serial_sequence('"${table_name}"', '${pkCol}');
                        IF seq_name IS NOT NULL THEN
                            EXECUTE 'SELECT COALESCE(MAX("${pkCol}"), 0) FROM "${table_name}"' INTO max_val;
                            PERFORM setval(seq_name, max_val + 1, false);
                            RAISE NOTICE 'Reset sequence for %.% to %', '${table_name}', '${pkCol}', max_val + 1;
                        END IF;
                    END $$;
                `;

                await sequelize.query(seqQuery);

                // Fetch sequence name for confirmation log
                const seqCheck = await sequelize.query(
                    `SELECT pg_get_serial_sequence('"${table_name}"', '${pkCol}') as seq`,
                    { type: Sequelize.QueryTypes.SELECT }
                );

                const seqName = seqCheck[0]?.seq;
                if (seqName) {
                    const maxRes = await sequelize.query(
                        `SELECT COALESCE(MAX("${pkCol}"), 0) as maxid FROM "${table_name}"`,
                        { type: Sequelize.QueryTypes.SELECT }
                    );
                    const currentMax = maxRes[0]?.maxid || 0;
                    console.log(`  [RESET] ${table_name}.${pkCol} → Sequence '${seqName}' synced to next ID: ${Number(currentMax) + 1}`);
                    resetCount++;
                } else {
                    console.log(`  [INFO] ${table_name}.${pkCol}: No serial sequence bound to column.`);
                }

            } catch (errTable) {
                console.error(`  [WARN] Could not reset sequence for ${table_name}:`, errTable.message);
            }
        }

        console.log(`\n=== Sequence Force Reset Complete! ${resetCount} sequences updated. ===`);
        process.exit(0);

    } catch (err) {
        console.error('Fatal error during sequence reset:', err);
        process.exit(1);
    }
}

forceResetSequences();
