const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function dumpAll() {
    try {
        const boxes = await sequelize.query(`SELECT "ID", "Box_detail" FROM box_locations ORDER BY "ID"::int ASC NULLS FIRST`, { type: Sequelize.QueryTypes.SELECT });
        console.log('ALL BOXES:', JSON.stringify(boxes));

        const racks = await sequelize.query(`SELECT "ID", "Rack_No" FROM rack_locations ORDER BY "ID"::int ASC NULLS FIRST`, { type: Sequelize.QueryTypes.SELECT });
        console.log('ALL RACKS:', JSON.stringify(racks));
    } catch (e) {
        console.error(e);
    }
}

dumpAll();
