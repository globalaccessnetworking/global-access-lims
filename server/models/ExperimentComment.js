const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExperimentComment = sequelize.define('ExperimentComment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'ext_experiment_comments',
    timestamps: true,
    underscored: true
});

module.exports = ExperimentComment;
