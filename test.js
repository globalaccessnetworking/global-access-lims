const { sequelize } = require('./server/models');

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
        const res = await sequelize.query(query);
        console.log("SUCCESS WITH CAST");
    } catch (e) {
        console.error("FAILED WITH CAST", e);
    }
    try {
        const query2 = `
            SELECT 
                b.box_name,
                MAX(l."Box_detail") as box_display_name,
                MAX(b.freezer_name) as freezer_name,
                COUNT(*) as total_capacity,
                SUM(CASE WHEN b.is_occupied THEN 1 ELSE 0 END) as occupied_count,
                SUM(CASE WHEN NOT b.is_occupied THEN 1 ELSE 0 END) as empty_count,
                SUM(CASE WHEN b.conflict_flag THEN 1 ELSE 0 END) as conflict_count
            FROM box_position_index b
            LEFT JOIN box_locations l ON b.box_name = l."ID"
            GROUP BY b.box_name
            ORDER BY b.box_name
        `;
        const res = await sequelize.query(query2);
        console.log("SUCCESS WITHOUT CAST");
    } catch(e) {
        console.error("FAILED WITHOUT CAST", e.message);
    }
}
test();
