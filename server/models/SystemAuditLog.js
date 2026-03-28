const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemAuditLog = sequelize.define('SystemAuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // System actions might not have a user
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    table_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    record_id: {
        type: DataTypes.STRING, // Using STRING to be safe, though usually ID
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    details: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'system_audit_logs',
    timestamps: false 
});

module.exports = SystemAuditLog;
