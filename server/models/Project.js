const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Archived'),
        defaultValue: 'Active'
    },
    start_date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    color_code: {
        type: DataTypes.STRING,
        defaultValue: '#10b981' // emerald-500
    }
}, {
    tableName: 'ext_lab_projects',
    timestamps: true,
    underscored: true
});

module.exports = Project;
