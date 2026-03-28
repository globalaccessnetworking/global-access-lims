const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class GenericRecord extends Model { }

GenericRecord.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    record_type: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    data: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    search_text: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'GenericRecord',
    tableName: 'GenericRecords',
    timestamps: true
});

module.exports = GenericRecord;
