const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomForm = sequelize.define('CustomForm', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    table_name: {
        type: DataTypes.STRING,
        allowNull: true // Assigned upon publication
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    schema_json: {
        type: DataTypes.JSON, // Stores the form structure (fields, layout, bindings)
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Draft', 'Published', 'Archived'),
        defaultValue: 'Draft'
    },
    created_by: {
        type: DataTypes.STRING, // Username or ID of Admin
        allowNull: true
    }
});

module.exports = CustomForm;
