const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AvailableAntibiotic = sequelize.define('AvailableAntibiotic', {
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
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    unit: {
        type: DataTypes.STRING,
        defaultValue: 'Discs'
    }
});

module.exports = AvailableAntibiotic;
