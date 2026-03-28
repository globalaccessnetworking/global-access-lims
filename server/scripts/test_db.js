const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('../config/database');

const test = async () => {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

test();
