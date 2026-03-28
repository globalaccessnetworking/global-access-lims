const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

// Mock request/response for the system route logic
async function testActualRouteLogic() {
    const tableName = 'ext_lab_tasks';
    console.log('--- TESTING ACTUAL ROUTE LOGIC ---');

    const SCHEMA_OVERRIDES = {
        'ext_lab_tasks': {
            'status': { type: 'select', options: ['Pending', 'Todo', 'In Progress', 'Review', 'Completed'] },
            'priority': { type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
        }
    };

    async function getForeignKeys(tn) { return []; }
    async function getForeignKeyOptions(t, c) { return []; }

    let schema = [];
    try {
        const description = await sequelize.getQueryInterface().describeTable(tableName);
        for (const key of Object.keys(description)) {
            const col = description[key];
            let item = {
                key: key,
                label: key.replace(/_/g, ' ').toUpperCase(),
                type: (col.type || '').toString().toLowerCase().includes('int') ? 'number' : 'text'
            };
            if (SCHEMA_OVERRIDES[tableName] && SCHEMA_OVERRIDES[tableName][key]) {
                item = { ...item, ...SCHEMA_OVERRIDES[tableName][key] };
                if (item.type === 'select' && item.options?.length > 0 && typeof item.options[0] === 'string') {
                    item.options = item.options.map(opt => ({ value: opt, label: opt }));
                }
            }
            schema.push(item);
        }
    } catch (e) {
        console.error('describeTable error:', e.message);
    }

    console.log('Resulting Schema fields:', schema.map(s => s.key));
    console.log('Resulting JSON:', JSON.stringify({ tableName, count: 0, schema }, null, 2));
    process.exit();
}

testActualRouteLogic();
