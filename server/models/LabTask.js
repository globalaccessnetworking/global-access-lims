const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LabTask = sequelize.define('LabTask', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Todo', 'In Progress', 'Review', 'Completed'),
        defaultValue: 'Pending'
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        defaultValue: 'Medium'
    },
    due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'General'
    }
}, {
    tableName: 'ext_lab_tasks',
    timestamps: true,
    underscored: true
});

module.exports = LabTask;
