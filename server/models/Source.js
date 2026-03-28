const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Source = sequelize.define('Source', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('Clinical', 'Environmental', 'Other'),
        defaultValue: 'Clinical'
    },
    details: {
        type: DataTypes.TEXT
    }
});

module.exports = Source;
