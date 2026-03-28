const axios = require('axios');

async function testSchema() {
    try {
        // Since we don't have a token here easily, we might need to bypass or use a mock.
        // But I'll try to just check the route logic by running it in a script.
        const { sequelize } = require('./models');
        const tableName = 'ext_lab_tasks';

        console.log('Testing schema generation for:', tableName);

        const SCHEMA_OVERRIDES = {
            'ext_lab_tasks': {
                'status': { type: 'select', options: ['Pending', 'Todo', 'In Progress', 'Review', 'Completed'] },
                'priority': { type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
            }
        };

        const description = await sequelize.getQueryInterface().describeTable(tableName);
        let schema = [];

        for (const key of Object.keys(description)) {
            const col = description[key];
            let item = {
                key: key,
                label: key.replace(/_/g, ' ').toUpperCase(),
                type: (col.type || '').toString().toLowerCase().includes('int') ? 'number' : 'text'
            };

            if (SCHEMA_OVERRIDES[tableName] && SCHEMA_OVERRIDES[tableName][key]) {
                item = { ...item, ...SCHEMA_OVERRIDES[tableName][key] };
            }
            schema.push(item);
        }

        console.log('Generated Schema Fields:', schema.map(s => s.key));
        console.log('Schema Detail:', JSON.stringify(schema, null, 2));

    } catch (err) {
        console.error('Test Failed:', err.message);
    } finally {
        process.exit();
    }
}

testSchema();
