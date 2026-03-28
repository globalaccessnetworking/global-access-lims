const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugBoxTable() {
    try {
        await sequelize.authenticate();
        const boxes = await sequelize.query(
            `SELECT * FROM "ext_location_detail_box_name" LIMIT 20`,
            { type: QueryTypes.SELECT }
        );
        console.log("Boxes:", JSON.stringify(boxes, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugBoxTable();
