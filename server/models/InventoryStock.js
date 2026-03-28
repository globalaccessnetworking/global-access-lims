const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class InventoryStock extends Model { }

InventoryStock.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    item_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    manufacturer: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pack_size: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    catalog_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    available_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    threshold_limit: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    location_area: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    location_details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    physical_location: {
        type: DataTypes.TEXT,
        allowNull: true
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
    unit_type: {
        type: DataTypes.STRING,
        allowNull: true // ML, G, L, MG
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    source: {
        type: DataTypes.STRING,
        defaultValue: 'Lab-Stock.csv'
    }
}, {
    sequelize,
    modelName: 'InventoryStock',
    tableName: 'InventoryStocks',
    timestamps: true
});

module.exports = InventoryStock;
