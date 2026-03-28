const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugMagnetStandalone() {
    try {
        await sequelize.authenticate();
        console.log("DB Connected.");

        const box = 'Samra G.S';
        console.log(`Searching for: ${box}`);

        // 1. Resolve Box Name to ID
        let boxId = null;
        try {
            const boxLookup = await sequelize.query(
                `SELECT "ID" FROM "ext_location_detail_box_name" WHERE "Box_detail" = :box`,
                { replacements: { box }, type: QueryTypes.SELECT }
            );
            if (boxLookup.length > 0) {
                boxId = boxLookup[0].ID;
                console.log(`Resolved Box ID: ${boxId}`);
            } else {
                console.log("Box ID not found.");
            }
        } catch (err) {
            console.error("Box ID Lookup Failed:", err);
        }

        const query = `
            SELECT * FROM (
                -- 1. Bacterial Strains (Green)
                SELECT 
                    'strain' as type,
                    CAST("id" AS VARCHAR) as asset_id,
                    "Strain_No" as name,
                    UPPER("Location_in_Box_GS") as position,
                    "GS_Box_details" as box_matched
                FROM "ext_bacterial_strains"
                WHERE 
                    (:boxId IS NOT NULL AND CAST("GS_Box_details" AS VARCHAR) = CAST(:boxId AS VARCHAR))
                    OR "GS_Box_details" = :box

                UNION ALL

                -- 2. Bacteriophages (Blue)
                SELECT 
                    'phage' as type,
                    CAST("id" AS VARCHAR) as asset_id,
                    "Bacteriophage_Name" as name,
                    UPPER("GS_position_in_Box") as position,
                    "GS_Box_details" as box_matched
                FROM "ext_bacteriophages"
                WHERE 
                    (:boxId IS NOT NULL AND CAST("GS_Box_details" AS VARCHAR) = CAST(:boxId AS VARCHAR))
                    OR "GS_Box_details" = :box

                UNION ALL

                -- 3. Primers (Purple)
                SELECT 
                    'primer' as type,
                    CAST("id" AS VARCHAR) as asset_id,
                    "Primer_Name" as name,
                    UPPER("Location_in_Box") as position,
                    "Box_detail" as box_matched
                FROM "ext_primers_details"
                WHERE 
                    (:boxId IS NOT NULL AND CAST("Box_detail" AS VARCHAR) = CAST(:boxId AS VARCHAR))
                    OR "Box_detail" = :box
            ) as unified_assets
        `;

        const results = await sequelize.query(query, {
            replacements: { box, boxId: boxId || null },
            type: QueryTypes.SELECT
        });

        console.log(`Query Results: ${results.length}`);
        if (results.length > 0) console.log(results[0]);

    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

debugMagnetStandalone();
