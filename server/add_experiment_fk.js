const { sequelize } = require('./models');

async function addForeignKey() {
    try {
        console.log('Adding foreign key constraint for experiment_id...');

        await sequelize.query(`
            ALTER TABLE ext_experiment_comments 
            ADD CONSTRAINT ext_experiment_comments_experiment_id_fkey 
            FOREIGN KEY (experiment_id) 
            REFERENCES "Experiments"(id) 
            ON UPDATE CASCADE 
            ON DELETE SET NULL
        `);

        console.log('✓ Foreign key constraint added successfully!');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('✓ Foreign key constraint already exists.');
        } else {
            console.error('Error:', e.message);
        }
    } finally {
        await sequelize.close();
    }
}

addForeignKey();
