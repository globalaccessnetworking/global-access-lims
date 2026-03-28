const sequelize = require('./config/database');
const { Sequelize } = require('sequelize');

async function checkIds() {
    try {
        console.log('--- PROJECTS ---');
        try {
            const [projects] = await sequelize.query('SELECT id, name FROM projects');
            console.log('Projects count:', projects.length);
            console.log('Projects:', projects);
        } catch (e) { console.log('projects table failed:', e.message); }

        try {
            const [extProjects] = await sequelize.query('SELECT id, name FROM ext_lab_projects');
            console.log('ext_lab_projects count:', extProjects.length);
            console.log('ext_lab_projects:', extProjects);
        } catch (e) { console.log('ext_lab_projects failed:', e.message); }

        console.log('--- USERS ---');
        try {
            const [users] = await sequelize.query('SELECT id, username FROM "Users"');
            console.log('"Users" count:', users.length);
            console.log('"Users":', users);
        } catch (e) { console.log('"Users" table failed:', e.message); }

        try {
            const [lUsers] = await sequelize.query('SELECT id, username FROM users');
            console.log('users count:', lUsers.length);
            console.log('users:', lUsers);
        } catch (e) { console.log('users table failed:', e.message); }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

checkIds();
