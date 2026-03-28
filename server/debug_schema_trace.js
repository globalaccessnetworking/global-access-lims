const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function debugSchemaRoute() {
    const tableName = 'ext_lab_tasks';
    console.log('--- DEBUGGING SCHEMA ROUTE FOR:', tableName, '---');

    const SCHEMA_OVERRIDES = {
        'ext_lab_tasks': {
            'status': { type: 'select', options: ['Pending', 'Todo', 'In Progress', 'Review', 'Completed'] },
            'priority': { type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
        }
    };

    let schema = [];
    let method = 'none';
    let errors = {};

    try {
        console.log('Step 1: describeTable');
        const description = await sequelize.getQueryInterface().describeTable(tableName);
        console.log('Description keys found:', Object.keys(description));

        if (description && Object.keys(description).length > 0) {
            for (const key of Object.keys(description)) {
                const col = description[key];
                let item = {
                    key: key,
                    label: key.replace(/_/g, ' ').toUpperCase(),
                    type: (col.type || '').toString().toLowerCase().includes('int') ? 'number' : 'text'
                };

                console.log(`Processing column: ${key}, type: ${col.type}`);

                // Apply Overrides
                if (SCHEMA_OVERRIDES[tableName] && SCHEMA_OVERRIDES[tableName][key]) {
                    console.log(`Applying override for: ${key}`);
                    item = { ...item, ...SCHEMA_OVERRIDES[tableName][key] };
                    if (item.type === 'select' && item.options?.length > 0 && typeof item.options[0] === 'string') {
                        item.options = item.options.map(opt => ({ value: opt, label: opt }));
                    }
                }

                schema.push(item);
            }
            method = 'describeTable';
        }
    } catch (e) {
        console.error('describeTable failed:', e.message);
        errors.describeTable = e.message;
    }

    console.log('--- FINAL SCHEMA RESULT ---');
    console.log('Method:', method);
    console.log('Schema Length:', schema.length);
    console.log('Schema Keys:', schema.map(s => s.key));
    console.log('Editable Keys (filtered):', schema.filter(c => !['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(c.key.toLowerCase())).map(s => s.key));

    process.exit();
}

debugSchemaRoute();
