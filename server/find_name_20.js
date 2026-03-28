const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function findName() {
    try {
        await sequelize.authenticate();
        const box = await sequelize.query(
            `SELECT "ID", "Box_detail" FROM "ext_location_detail_box_name" WHERE "ID" = '20'`,
            { type: QueryTypes.SELECT }
        );
        console.log("Found Box:", JSON.stringify(box, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

findName();
