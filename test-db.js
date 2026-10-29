const { sequelize } = require('./server/models');
const { QueryTypes } = require('sequelize');

async function test() {
    try {
        const numericId = 76; // SGP-3 or something similar
        const allStrains = await sequelize.query(
            `SELECT
                s.id AS strain_id,
                s."Strain_No"  AS strain_name,
                bs."Species"   AS species_name,
                s."Detail_of_Bacterial_Strain" AS detail,
                s."Glycerol_Stock_tube_label"   AS stock_label,
                i.result,
                i.date_tested,
                i.tested_by,
                'recorded' AS status
             FROM ext_bacterial_strains s
             LEFT JOIN bacterial_species bs ON bs."ID"::text = s."Specie"::text
             INNER JOIN ext_phage_host_interactions i ON i.strain_id = s.id AND i.phage_id = ${numericId}
             WHERE s."Strain_No" IS NOT NULL 
               AND TRIM(s."Strain_No") != ''
             ORDER BY s."Strain_No" ASC`,
            { type: QueryTypes.SELECT }
        ).catch(err => { console.error('Error:', err.message); return []; });
        console.log(allStrains);
    } catch (e) {
        console.error(e);
    }
}
test();
