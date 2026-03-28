const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhageHostMatrix = sequelize.define('PhageHostMatrix', {
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
    strain_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'BiologicalAssets',
            key: 'id'
        }
    },
    lysis_score: {
        type: DataTypes.ENUM('+', '++', '+++', '-', 'Clear', 'Turbid'),
        allowNull: false,
        defaultValue: '-'
    }
}, {
    tableName: 'phage_host_matrix',
    timestamps: true
});

module.exports = PhageHostMatrix;
