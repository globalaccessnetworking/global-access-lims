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
    
    // Legacy String Fields
    species: { type: DataTypes.STRING },
    source: { type: DataTypes.STRING },
    
    // New Integer Foreign Keys for Phase 113
    species_id: { type: DataTypes.INTEGER },
    wild_type_id: { type: DataTypes.INTEGER },
    source_id: { type: DataTypes.INTEGER },
    stock_category_id: { type: DataTypes.INTEGER },
    
    // Phage specific
    phage_name_id: { type: DataTypes.INTEGER },
    host_strain_id: { type: DataTypes.INTEGER },
    against_species_id: { type: DataTypes.INTEGER },
    lytic_type_id: { type: DataTypes.INTEGER },
    
    // Plasmid specific
    plasmid_vector_id: { type: DataTypes.INTEGER },
    gene_source_id: { type: DataTypes.INTEGER },
    cloning_method_id: { type: DataTypes.INTEGER },
    antibiotic_marker_id: { type: DataTypes.INTEGER },
    
    // Lab-Stock / Primer specific
    manufacturer_id: { type: DataTypes.INTEGER },
    target_phage_id: { type: DataTypes.INTEGER },
    target_plasmid_id: { type: DataTypes.INTEGER },

    strain_number: {
        type: DataTypes.STRING,
        unique: true
    },
    characteristics: { type: DataTypes.TEXT },
    image_url: { type: DataTypes.STRING },
    morphology: { type: DataTypes.JSON },
    sequence_data: { type: DataTypes.TEXT },
    endotoxin_units: { type: DataTypes.FLOAT },
    sterility_status: {
        type: DataTypes.ENUM('Pass', 'Fail', 'Pending'),
        defaultValue: 'Pending'
    },
    last_validated_date: { type: DataTypes.DATEONLY },
    
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
