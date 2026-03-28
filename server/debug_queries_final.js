const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugQueries() {
    try {
        await sequelize.authenticate();
        console.log("Connected.");

        // 1. debug getBoxes
        console.log("--- Testing getBoxes Query ---");
        const boxQuery = `
            SELECT DISTINCT
                f."Freezer" as freezer_name,
                b."Box_detail" as box,
                r."Rack_No" as rack
            FROM "ext_location_detail_freezer" f
            CROSS JOIN "ext_location_detail_box_name" b
            LEFT JOIN "StorageLocations" sl ON 
                CAST(f."ID" AS VARCHAR) = CAST(sl.freezer_name AS VARCHAR) AND 
                CAST(b."ID" AS VARCHAR) = CAST(sl.box AS VARCHAR)
            LEFT JOIN "ext_location_detail_rack" r ON CAST(sl.rack AS VARCHAR) = CAST(r."ID" AS VARCHAR)
            ORDER BY f."Freezer" ASC, box ASC
            LIMIT 5
        `;
        try {
            const boxes = await sequelize.query(boxQuery, { type: QueryTypes.SELECT });
            console.log("Boxes Success (Sample):", JSON.stringify(boxes[0]));
        } catch (e) {
            console.error("Boxes Query Failed:", e.message);
        }

        // 2. debug getStorageHub
        console.log("--- Testing getStorageHub Query ---");
        const hubQuery = `
            SELECT 
                sl.position,
                ba.id as asset_id,
                -- External Joins
                bs."Specie" as strain_species,
                bs."Strain_Desc" as strain_desc
            FROM "StorageLocations" sl
            LEFT JOIN "ext_location_detail_box_name" ext_box ON CAST(sl.box AS VARCHAR) = CAST(ext_box."ID" AS VARCHAR)
            LEFT JOIN "BiologicalAssets" ba ON sl.id = ba.storage_location_id
            LEFT JOIN "ext_bacterial_strains" bs ON ba.strain_number = bs."Strain_No"
            
            LIMIT 1
        `;
        // We just test if columns exist
        try {
            const hub = await sequelize.query(hubQuery, { type: QueryTypes.SELECT });
            console.log("Hub Query Success");
        } catch (e) {
            console.error("Hub Query Failed:", e.message);
        }

    } catch (error) {
        console.error("General Error:", error);
    } finally {
        await sequelize.close();
    }
}

debugQueries();
