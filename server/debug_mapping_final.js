const { sequelize } = require('./models');

async function debug() {
    const tableName = 'ext_lab_tasks';
    try {
        console.log(`--- Debugging Mapping for: ${tableName} ---`);
        const description = await sequelize.getQueryInterface().describeTable(tableName);

        const schema = [];
        for (const key of Object.keys(description)) {
            const col = description[key];
            const item = {
                key: key,
                label: key.replace(/_/g, ' ').toUpperCase(),
                type: (col.type || '').toString().toLowerCase().includes('int') ? 'number' : 'text'
            };

            console.log(`Column: ${key}, RawType: ${col.type}, Special:`, col.special);

            // The logic from system.js
            if (col.special && Array.isArray(col.special) && col.special.length > 0) {
                item.type = 'select';
                item.options = col.special;
            } else if (col.type && (col.type.includes('ENUM') || col.type.startsWith('enum_'))) {
                item.type = 'select'; // Mark it at least
                item.debug = 'manual_fallback_triggered';
            }
            schema.push(item);
        }

        console.log('--- Resulting Schema ---');
        console.log(JSON.stringify(schema, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
