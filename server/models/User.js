const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('SuperAdmin', 'Admin', 'Researcher', 'Student'),
        defaultValue: 'Student'
    },
    permissions: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    last_login: {
        type: DataTypes.DATE
    }
});

module.exports = User;

