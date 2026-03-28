const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EquipmentLog = sequelize.define('EquipmentLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    equipment_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    serial_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_calibration_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    next_due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Operational', 'Maintenance Due', 'Out of Order'),
        defaultValue: 'Operational'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'ext_equipment_logs',
    timestamps: true
});

module.exports = EquipmentLog;
