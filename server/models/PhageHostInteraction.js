const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhageHostInteraction = sequelize.define('PhageHostInteraction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    phage_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'BiologicalAssets',
            key: 'id'
        }
    },
    host_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'BiologicalAssets',
            key: 'id'
        }
    },
    sensitivity: {
        type: DataTypes.ENUM('Clear', 'Turbid', 'None'),
        defaultValue: 'None'
    }
});

module.exports = PhageHostInteraction;
