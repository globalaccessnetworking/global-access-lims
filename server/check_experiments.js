const { sequelize } = require('./models');

async function checkExperiments() {
    try {
        const [rows] = await sequelize.query('SELECT COUNT(*) as count FROM "Experiments"');
        console.log('Total Experiments:', rows[0].count);

        if (rows[0].count > 0) {
            const [samples] = await sequelize.query('SELECT id, title FROM "Experiments" LIMIT 5');
            console.log('\nSample Experiments:');
            console.log(JSON.stringify(samples, null, 2));
        } else {
            console.log('\n⚠ No experiments found in the database.');
            console.log('This is why the dropdown is empty!');
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

checkExperiments();
