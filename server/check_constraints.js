const { sequelize } = require('./models');

async function checkConstraints() {
    try {
        const query = `
            SELECT 
                conname, 
                pg_get_constraintdef(oid) as definition 
            FROM pg_constraint 
            WHERE conrelid = 'ext_experiment_comments'::regclass 
            AND contype = 'f'
        `;
        const [results] = await sequelize.query(query);
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await sequelize.close();
    }
}

checkConstraints();
