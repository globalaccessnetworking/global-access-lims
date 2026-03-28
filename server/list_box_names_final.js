const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function listBoxes() {
    try {
        await sequelize.authenticate();
        const boxes = await sequelize.query(
            `SELECT "ID", "Box_detail" FROM "ext_location_detail_box_name" ORDER BY "Box_detail" ASC LIMIT 50`,
            { type: QueryTypes.SELECT }
        );
        console.log("Box Names:", JSON.stringify(boxes, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

listBoxes();
