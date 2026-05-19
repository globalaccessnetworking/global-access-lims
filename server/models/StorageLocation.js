const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StorageLocation = sequelize.define('StorageLocation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // New Integer Foreign Keys
    freezer_id: { type: DataTypes.INTEGER },
    rack_id: { type: DataTypes.INTEGER },
    box_id: { type: DataTypes.INTEGER },
    
    // Legacy String Fields (Keep for backward compatibility during migration)
    freezer_name: { type: DataTypes.STRING },
    rack: { type: DataTypes.STRING },
    box: { type: DataTypes.STRING },
    
    position: { type: DataTypes.STRING }
});

module.exports = StorageLocation;
