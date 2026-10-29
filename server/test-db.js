const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');
async function test() {
    try {
        // Check SalA10 (id=1210, GS_Box_details=122) in box_position_index
        const bpi1210 = await sequelize.query(
            `SELECT * FROM box_position_index WHERE source_table = 'ext_bacterial_strains' AND asset_id = 1210`,
            { type: QueryTypes.SELECT }
        );
        console.log("SalA10 (id=1210) in box_position_index:", bpi1210);

        // Check if box_locations has ID=122
        const box122 = await sequelize.query(
            `SELECT * FROM box_locations WHERE id = 122 OR "ID"::text = '122' LIMIT 1`,
            { type: QueryTypes.SELECT }
        );
        console.log("\nbox_locations for ID=122:", box122);

        // Check what the highest box_locations ID is
        const maxBox = await sequelize.query(
            `SELECT MAX(id) as maxid, COUNT(*) as total FROM box_locations`,
            { type: QueryTypes.SELECT }
        );
        console.log("\nMax box_locations ID:", maxBox[0]);
    } catch(e) { console.error(e); }
}
test();
