const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavedQuery = sequelize.define('SavedQuery', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    type: {
        type: DataTypes.ENUM('static', 'dynamic'), // 'static' = ingested CSV, 'dynamic' = SQL builder
        defaultValue: 'dynamic'
    },
    // For Dynamic Queries
    query_config: {
        type: DataTypes.JSON, // Stores builder state: { table: 'InventoryStock', filters: [], columns: [] }
        allowNull: true
    },
    // For Static Queries (Ingested CSVs)
    static_data: {
        type: DataTypes.JSON, // Stores the full dataset [ {col: val}, ... ]
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = SavedQuery;
