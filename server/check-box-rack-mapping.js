const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function check() {
    try {
        console.log('=== box_locations for primer IDs ===');
        const boxes = await sequelize.query(`SELECT "ID", "Box_detail" FROM box_locations WHERE "ID"::text IN ('21','22','23','24','99','100','101','102','103','104') ORDER BY "ID"`, { type: Sequelize.QueryTypes.SELECT });
        console.log(boxes);

        console.log('\n=== rack_locations for primer Rack IDs ===');
        const racks = await sequelize.query(`SELECT "ID", "Rack_No" FROM rack_locations WHERE "ID"::text IN ('5','13','17','20','21') ORDER BY "ID"`, { type: Sequelize.QueryTypes.SELECT });
        console.log(racks);
    } catch (e) {
        console.error(e);
    }
}

check();
