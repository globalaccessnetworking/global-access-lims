const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AntibioticSensitivity = sequelize.define('AntibioticSensitivity', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    zone_size: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    interpretation: {
        type: DataTypes.ENUM('Resistant', 'Intermediate', 'Sensitive'),
        allowNull: false
    }
});

module.exports = AntibioticSensitivity;
