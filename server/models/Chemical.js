const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chemical = sequelize.define('Chemical', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    barcode: {
        type: DataTypes.STRING,
        unique: true
    },
    qr_identity_string: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    current_volume: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    max_volume: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    stock_alert_level: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    threshold_limit: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    unit: {
        type: DataTypes.STRING
    },
    unit_type: {
        type: DataTypes.STRING,
        allowNull: true // ML, G, L, MG
    },
    expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    ghs_hazards: {
        type: DataTypes.JSON,
        allowNull: true
    },
    signal_word: {
        type: DataTypes.ENUM('None', 'Warning', 'Danger'),
        defaultValue: 'None'
    },
    sds_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    supplier_email: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Chemical;
