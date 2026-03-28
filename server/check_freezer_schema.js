const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function checkSchema() {
    try {
        await sequelize.authenticate();
        console.log("Connected.");

        const freezerCols = await sequelize.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'ext_location_detail_freezer';",
            { type: QueryTypes.SELECT }
        );
        console.log("Freezer Cols:", freezerCols.map(c => c.column_name));

        const boxCols = await sequelize.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'ext_location_detail_box_name';",
            { type: QueryTypes.SELECT }
        );
        console.log("Box Cols:", boxCols.map(c => c.column_name));

        const rackCols = await sequelize.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'ext_location_detail_rack';",
            { type: QueryTypes.SELECT }
        );
        console.log("Rack Cols:", rackCols.map(c => c.column_name));

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
