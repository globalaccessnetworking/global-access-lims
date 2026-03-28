const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Experiment = sequelize.define('Experiment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    protocol: {
        type: DataTypes.ENUM('Enrichment', 'DLA', 'Spot Test', 'One-Step Growth', 'Other'),
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT
    },
    asset_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'BiologicalAssets',
            key: 'id'
        }
    },
    attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    researcher_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

module.exports = Experiment;
