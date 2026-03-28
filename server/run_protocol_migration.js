const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔄 Running protocol tables migration...');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'migrations', '011_create_protocol_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the SQL
        await sequelize.query(sql);

        console.log('✅ Protocol tables created successfully!');

        // Verify the tables
        const [protocols] = await sequelize.query('SELECT COUNT(*) as count FROM protocols');
        const [executions] = await sequelize.query('SELECT COUNT(*) as count FROM protocol_executions');

        console.log(`📊 Protocols table: ${protocols[0].count} sample protocols loaded`);
        console.log(`📊 Protocol executions table: ${executions[0].count} executions`);

        // List the sample protocols
        const [protocolList] = await sequelize.query('SELECT id, name, category, estimated_time FROM protocols');
        console.log('\n📋 Sample Protocols:');
        protocolList.forEach(p => {
            console.log(`   ${p.id}. ${p.name} (${p.category}, ${p.estimated_time} min)`);
        });

        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
