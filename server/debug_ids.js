const sequelize = require('./config/database');
const { Sequelize } = require('sequelize');

async function debugData() {
    try {
        console.log('--- CHECKING PROJECT DATA ---');
        const [projects] = await sequelize.query('SELECT id, name FROM ext_lab_projects');
        console.log('Available Projects:', projects);

        console.log('--- CHECKING USER DATA ---');
        const [users] = await sequelize.query('SELECT id, username FROM users');
        console.log('Available Users (first 10):', users.slice(0, 10));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

debugData();
