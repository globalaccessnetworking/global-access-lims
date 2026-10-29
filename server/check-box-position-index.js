const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function checkIndex() {
    try {
        const rows = await sequelize.query(
            `SELECT asset_id, asset_label, box_name, position_code FROM box_position_index WHERE asset_type = 'primer' LIMIT 30`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        console.log('Primers in box_position_index:', rows);
    } catch (e) {
        console.error(e);
    }
}

checkIndex();
