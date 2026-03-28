const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chemical_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Chemicals',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Ordered', 'Received'),
        defaultValue: 'Pending'
    },
    quantity: {
        type: DataTypes.FLOAT
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = PurchaseOrder;
