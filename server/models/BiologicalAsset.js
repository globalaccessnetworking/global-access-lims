const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BiologicalAsset = sequelize.define('BiologicalAsset', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('Strain', 'Phage', 'Plasmid', 'Primer'),
        allowNull: false
    },
    species: {
        type: DataTypes.STRING
    },
    strain_number: {
        type: DataTypes.STRING,
        unique: true
    },
    source: {
        type: DataTypes.STRING
    },
    characteristics: {
        type: DataTypes.TEXT
    },
    image_url: {
        type: DataTypes.STRING
    },
    morphology: {
        type: DataTypes.JSON
    },
    sequence_data: {
        type: DataTypes.TEXT
    },
    endotoxin_units: {
        type: DataTypes.FLOAT
    },
    sterility_status: {
        type: DataTypes.ENUM('Pass', 'Fail', 'Pending'),
        defaultValue: 'Pending'
    },
    last_validated_date: {
        type: DataTypes.DATEONLY
    },
    storage_location_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'StorageLocations',
            key: 'id'
        }
    }
}, {
    tableName: 'BiologicalAssets',
    timestamps: true
});

module.exports = BiologicalAsset;
