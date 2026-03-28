const { sequelize } = require('./models');

async function debugSchemaMapping(tableName) {
    try {
        console.log(`--- Debugging Schema Mapping for: ${tableName} ---`);
        const description = await sequelize.getQueryInterface().describeTable(tableName);

        console.log('Raw Description Keys:', Object.keys(description));

        const schema = Object.keys(description).map(key => {
            const col = description[key];
            const typeStr = (col.type || '').toString().toLowerCase();
            return {
                key: key,
                label: key.replace(/_/g, ' ').toUpperCase(),
                type: typeStr.includes('int') ? 'number' : 'text',
                rawType: col.type
            };
        });

        console.log('Mapped Schema:', JSON.stringify(schema, null, 2));

        const excluded = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'];
        const editable = schema.filter(c => !excluded.includes(c.key.toLowerCase()));

        console.log('Editable Fields (Filtered):', editable.map(e => e.key));
        console.log('Empty?:', editable.length === 0);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

debugSchemaMapping('ext_lab_projects');
