const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');

async function test() {
    try {
        const query = `
            SELECT 
                b.box_name,
                MAX(l."Box_detail") as box_display_name,
                MAX(b.freezer_name) as freezer_name,
                COUNT(*) as total_capacity,
                SUM(CASE WHEN b.is_occupied THEN 1 ELSE 0 END) as occupied_count,
                SUM(CASE WHEN NOT b.is_occupied THEN 1 ELSE 0 END) as empty_count,
                SUM(CASE WHEN b.conflict_flag THEN 1 ELSE 0 END) as conflict_count
            FROM box_position_index b
            LEFT JOIN box_locations l ON CAST(b.box_name AS TEXT) = CAST(l."ID" AS TEXT)
            GROUP BY b.box_name
            ORDER BY b.box_name
        `;
        const res = await sequelize.query(query, { type: QueryTypes.SELECT });
        console.log("BOXES: ", res);
    } catch (e) {
        console.error("FAILED", e);
    }
}
test();
