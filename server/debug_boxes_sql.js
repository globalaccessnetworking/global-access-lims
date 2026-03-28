const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugBoxes() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        // The query from getBoxes
        const query = `
            SELECT DISTINCT
                b.Box_detail as box,
                f.Freezer as freezer_name,
                r.Rack_No as rack
            FROM "StorageLocations" sl
            LEFT JOIN "ext_location_detail_box_name" b ON sl.box = b.ID
            LEFT JOIN "ext_location_detail_freezer" f ON sl.freezer_name = f.ID
            LEFT JOIN "ext_location_detail_rack" r ON sl.rack = r.ID
            WHERE sl.box IS NOT NULL
            ORDER BY f.Freezer ASC, r.Rack_No ASC, b.Box_detail ASC
        `;

        const boxes = await sequelize.query(query, { type: QueryTypes.SELECT });
        console.log("Boxes retrieved:", boxes.length);
        console.log("Sample:", boxes[0]);

    } catch (error) {
        console.error("SQL Error:", error);
    } finally {
        await sequelize.close();
    }
}

debugBoxes();
