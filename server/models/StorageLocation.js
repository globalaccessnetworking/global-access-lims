const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StorageLocation = sequelize.define('StorageLocation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    freezer_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rack: {
        type: DataTypes.STRING
    },
    box: {
        type: DataTypes.STRING
    },
    position: {
        type: DataTypes.STRING
    }
});

module.exports = StorageLocation;
