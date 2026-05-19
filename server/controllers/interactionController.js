/**
 * Phase 182 — Infectivity Viewer Backend Routes
 *
 * Architecture: Read-only. Uses EXISTING legacy columns from ext_bacteriophages.
 *   - Host_Bacteria  → FK to ext_host_bacteria (Host_Bacteria_No)
 *   - Against_Species → FK to bacterial_species (Species name)
 *   - Strains are matched via ext_bacterial_strains.Specie joining to bacterial_species
 *
 * IMPORTANT: The junction table (ext_phage_host_interactions) is PRESERVED for
 * future lab-recorded data. The viewer simply shows both legacy + recorded data.
 */

const { QueryTypes } = require('sequelize');

// ─── GET /api/interactions/matrix ─────────────────────────────────────────────
exports.getMatrix = async (req, res) => {
    try {
        const { sequelize } = require('../models');
        const {
            phage_search  = '',
            strain_search = '',
            phage_limit   = 20,
            strain_limit  = 1000,
            phage_offset  = 0,
            strain_offset = 0
        } = req.query;

        const pLim = Number(phage_limit);
        const pOff = Number(phage_offset);
        const sLim = Number(strain_limit);
        const sOff = Number(strain_offset);

        // ── PHAGES ────────────────────────────────────────────────────────────
        let phageSQL;
        if (phage_search && phage_search.trim() !== '') {
            const s = phage_search.trim().replace(/'/g, "''");
            phageSQL = `
                SELECT b.id,
                       COALESCE(n."Bacteriophage_Name", b."Bacteriophage_Name"::text) AS name
                FROM ext_bacteriophages b
                LEFT JOIN phage_names n ON n."ID"::text = b."Bacteriophage_Name"::text
                WHERE n."Bacteriophage_Name" ILIKE '%${s}%'
                   OR b.id::text = '${s}'
                ORDER BY b.id ASC
                LIMIT ${pLim} OFFSET ${pOff}
            `;
        } else {
            phageSQL = `
                SELECT b.id,
                       COALESCE(n."Bacteriophage_Name", b."Bacteriophage_Name"::text) AS name
                FROM ext_bacteriophages b
                LEFT JOIN phage_names n ON n."ID"::text = b."Bacteriophage_Name"::text
                ORDER BY b.id ASC
                LIMIT ${pLim} OFFSET ${pOff}
            `;
        }

        const phages = await sequelize.query(phageSQL, { type: QueryTypes.SELECT })
            .catch(err => { console.error('[MATRIX] ❌ Phage query error:', err.message); return []; });

        // ── STRAINS ───────────────────────────────────────────────────────────
        let strainSQL;
        if (strain_search && strain_search.trim() !== '') {
            const s = strain_search.trim().replace(/'/g, "''");
            strainSQL = `
                SELECT id, "Strain_No" AS name, "Specie" AS species
                FROM ext_bacterial_strains
                WHERE ("Strain_No" ILIKE '%${s}%' OR "Specie" ILIKE '%${s}%')
                  AND "Strain_No" IS NOT NULL 
                  AND TRIM("Strain_No") != ''
                ORDER BY "Strain_No" ASC
                LIMIT ${sLim} OFFSET ${sOff}
            `;
        } else {
            strainSQL = `
                SELECT id, "Strain_No" AS name, "Specie" AS species
                FROM ext_bacterial_strains
                WHERE "Strain_No" IS NOT NULL 
                  AND TRIM("Strain_No") != ''
                ORDER BY "Strain_No" ASC
                LIMIT ${sLim} OFFSET ${sOff}
            `;
        }

        const strains = await sequelize.query(strainSQL, { type: QueryTypes.SELECT })
            .catch(err => { console.error('[MATRIX] ❌ Strain query error:', err.message); return []; });

        // ── RECORDED INTERACTIONS (junction table) ────────────────────────────
        let interactions = [];
        if (phages.length > 0 && strains.length > 0) {
            const phageIdList  = phages.map(p => Number(p.id)).join(',');
            const strainIdList = strains.map(s => Number(s.id)).join(',');
            interactions = await sequelize.query(
                `SELECT phage_id::text, strain_id::text, result, tested_by, date_tested, notes
                 FROM ext_phage_host_interactions
                 WHERE phage_id  IN (${phageIdList})
                   AND strain_id IN (${strainIdList})`,
                { type: QueryTypes.SELECT }
            ).catch(err => { console.error('[MATRIX] ❌ Interactions query error:', err.message); return []; });
        }

        // ── TOTALS ────────────────────────────────────────────────────────────
        const [[phageCount], [strainCount]] = await Promise.all([
            sequelize.query('SELECT COUNT(*) AS total FROM ext_bacteriophages', { type: QueryTypes.SELECT }).catch(() => [{ total: 0 }]),
            sequelize.query('SELECT COUNT(*) AS total FROM ext_bacterial_strains', { type: QueryTypes.SELECT }).catch(() => [{ total: 0 }])
        ]);

        console.log(`[MATRIX] ✅ Loaded: ${phages.length} phages, ${strains.length} strains, ${interactions.length} interactions`);

        res.json({
            success: true, phages, strains, interactions,
            totals: { phages: Number(phageCount?.total || 0), strains: Number(strainCount?.total || 0) }
        });

    } catch (err) {
        console.error('[MATRIX] ❌ Fatal:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─── POST /api/interactions/upsert ────────────────────────────────────────────
exports.upsertInteraction = async (req, res) => {
    try {
        const { sequelize } = require('../models');
        console.log('[UPSERT] Received body:', JSON.stringify(req.body));

        const { phage_id, strain_id, result, tested_by = null, date_tested = null, notes = null } = req.body;

        if (!phage_id || !strain_id || !result) {
            console.log('[UPSERT] ❌ Missing required fields:', { phage_id, strain_id, result });
            return res.status(400).json({ success: false, error: 'phage_id, strain_id, and result are required.' });
        }

        const pid  = Number(phage_id);
        const sid  = Number(strain_id);
        const res_ = String(result).replace(/'/g, "''");
        const tby  = tested_by   ? `'${String(tested_by).replace(/'/g, "''")}'`   : 'NULL';
        const dt   = date_tested ? `'${String(date_tested).replace(/'/g, "''")}'` : `'${new Date().toISOString().split('T')[0]}'`;
        const nt   = notes       ? `'${String(notes).replace(/'/g, "''")}'`       : 'NULL';

        // SELECT → UPDATE/INSERT (no ON CONFLICT dependency)
        const [existing] = await sequelize.query(
            `SELECT id FROM ext_phage_host_interactions WHERE phage_id = ${pid} AND strain_id = ${sid} LIMIT 1`,
            { type: QueryTypes.SELECT }
        );

        if (existing) {
            await sequelize.query(
                `UPDATE ext_phage_host_interactions
                 SET result = '${res_}', tested_by = ${tby}, date_tested = ${dt}, notes = ${nt}, updated_at = NOW()
                 WHERE phage_id = ${pid} AND strain_id = ${sid}`,
                { type: QueryTypes.UPDATE }
            );
            console.log(`[UPSERT] ✅ UPDATED: Phage ${pid} × Strain ${sid} = ${result}`);
        } else {
            await sequelize.query(
                `INSERT INTO ext_phage_host_interactions
                    (phage_id, strain_id, result, tested_by, date_tested, notes, created_at, updated_at)
                 VALUES (${pid}, ${sid}, '${res_}', ${tby}, ${dt}, ${nt}, NOW(), NOW())`,
                { type: QueryTypes.INSERT }
            );
            console.log(`[UPSERT] ✅ INSERTED: Phage ${pid} × Strain ${sid} = ${result}`);
        }

        res.json({ success: true, phage_id: pid, strain_id: sid, result });

    } catch (err) {
        console.error('[UPSERT] ❌ Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─── GET /api/interactions/profile/:phageId ───────────────────────────────────
// Phase 182: Dual-source profile.
// Source 1 (Legacy): ext_bacteriophages.Against_Species → bacterial_species → ext_bacterial_strains
// Source 2 (Recorded): ext_phage_host_interactions
exports.getProfile = async (req, res) => {
    try {
        const { sequelize } = require('../models');
        const numericId = Number(req.params.phageId);

        if (isNaN(numericId)) return res.status(400).json({ success: false, error: 'Invalid phage ID.' });

        console.log(`[PROFILE] Loading profile for phage_id = ${numericId}`);

        // Get phage details including legacy Host_Bacteria and Against_Species
        const [phage] = await sequelize.query(
            `SELECT
                b.id,
                COALESCE(n."Bacteriophage_Name", b."Bacteriophage_Name"::text) AS phage_name,
                b."Host_Bacteria"  AS host_bacteria_id,
                b."Against_Species" AS against_species_id,
                hb."Host_Bacteria_No"  AS host_bacteria_name,
                sp."Species"           AS against_species_name
             FROM ext_bacteriophages b
             LEFT JOIN phage_names n        ON n."ID"::text = b."Bacteriophage_Name"::text
             LEFT JOIN ext_host_bacteria hb ON hb."id"::text = b."Host_Bacteria"::text
             LEFT JOIN bacterial_species sp ON sp."ID"::text = b."Against_Species"::text
             WHERE b.id = ${numericId}
             LIMIT 1`,
            { type: QueryTypes.SELECT }
        ).catch(err => { console.error('[PROFILE] phage lookup error:', err.message); return []; });

        if (!phage) return res.status(404).json({ success: false, error: 'Phage not found.' });

        // Source 1: Legacy strains matched by species
        // Phase 183 FIX: ext_bacterial_strains."Specie" is a NUMERIC FK to bacterial_species.ID.
        // ext_bacteriophages."Against_Species" is ALSO a numeric FK to bacterial_species.ID.
        // Correct approach: match the two integer FKs directly (ID-to-ID),
        // then JOIN bacterial_species only for the human-readable display label.
        // NEVER try to match the resolved text string against the numeric Specie column.
        let legacyStrains = [];
        if (phage.against_species_id !== null && phage.against_species_id !== undefined) {
            const speciesId = Number(phage.against_species_id);
            console.log(`[PROFILE] Matching strains where Specie ID = ${speciesId} (= "${phage.against_species_name}")`);
            legacyStrains = await sequelize.query(
                `SELECT
                    s."Strain_No"  AS strain_name,
                    bs."Species"   AS species_name,
                    s."Detail_of_Bacterial_Strain" AS detail,
                    s."Glycerol_Stock_tube_label"   AS stock_label,
                    'legacy' AS source
                 FROM ext_bacterial_strains s
                 LEFT JOIN bacterial_species bs ON bs."ID"::text = s."Specie"::text
                 WHERE s."Specie"::text = '${speciesId}'
                   AND s."Strain_No" IS NOT NULL 
                   AND TRIM(s."Strain_No") != ''
                 ORDER BY s."Strain_No" ASC
                 LIMIT 1000`,
                { type: QueryTypes.SELECT }
            ).catch(err => { console.error('[PROFILE] legacy strain error:', err.message); return []; });
        } else {
            console.log(`[PROFILE] No Against_Species ID set for phage_id=${numericId} — skipping legacy lookup`);
        }

        // Source 2: Recorded interactions (junction table)
        const recordedInteractions = await sequelize.query(
            `SELECT
                s."Strain_No"  AS strain_name,
                bs."Species"   AS species_name,
                s."Detail_of_Bacterial_Strain" AS detail,
                s."Glycerol_Stock_tube_label"   AS stock_label,
                i.result,
                i.date_tested,
                i.tested_by,
                i.notes,
                'recorded' AS source
             FROM ext_phage_host_interactions i
             JOIN ext_bacterial_strains s ON i.strain_id = s.id
             LEFT JOIN bacterial_species bs ON bs."ID"::text = s."Specie"::text
             WHERE i.phage_id = ${numericId}
             ORDER BY i.result DESC, s."Strain_No" ASC`,
            { type: QueryTypes.SELECT }
        ).catch(err => { console.error('[PROFILE] recorded error:', err.message); return []; });

        console.log(`[PROFILE] Legacy strains: ${legacyStrains.length}, Recorded: ${recordedInteractions.length}`);

        res.json({
            success: true,
            phage_name: phage.phage_name || `Phage #${numericId}`,
            host_bacteria: phage.host_bacteria_name || null,
            against_species: phage.against_species_name || null,
            legacy_strains: legacyStrains,
            recorded_interactions: recordedInteractions,
            total_legacy: legacyStrains.length,
            total_recorded: recordedInteractions.length
        });

    } catch (err) {
        console.error('[PROFILE] Fatal:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─── GET /api/interactions/all-phages ─────────────────────────────────────────
// Phase 182: Full phage list for the dropdown selector
exports.getAllPhages = async (req, res) => {
    try {
        const { sequelize } = require('../models');
        const { search = '' } = req.query;
        const s = search.trim().replace(/'/g, "''");

        const whereClause = s
            ? `WHERE n."Bacteriophage_Name" ILIKE '%${s}%' OR b.id::text = '${s}'`
            : '';

        const phages = await sequelize.query(
            `SELECT DISTINCT ON (COALESCE(n."Bacteriophage_Name", b."Bacteriophage_Name"::text))
                b.id,
                COALESCE(n."Bacteriophage_Name", b."Bacteriophage_Name"::text) AS phage_name,
                hb."Host_Bacteria_No" AS host_bacteria,
                sp."Species"          AS against_species
             FROM ext_bacteriophages b
             LEFT JOIN phage_names n        ON n."ID"::text = b."Bacteriophage_Name"::text
             LEFT JOIN ext_host_bacteria hb ON hb."id"::text = b."Host_Bacteria"::text
             LEFT JOIN bacterial_species sp ON sp."ID"::text = b."Against_Species"::text
             ${whereClause}
             ORDER BY COALESCE(n."Bacteriophage_Name", b."Bacteriophage_Name"::text) ASC, b.id ASC`,
            { type: QueryTypes.SELECT }
        );

        res.json({ success: true, phages, count: phages.length });

    } catch (err) {
        console.error('[PHAGES] error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─── GET /api/interactions/export ─────────────────────────────────────────────
exports.exportMatrix = async (req, res) => {
    try {
        const { sequelize } = require('../models');
        const rows = await sequelize.query(
            `SELECT
                COALESCE(n."Bacteriophage_Name", b."Bacteriophage_Name"::text) AS phage_name,
                s."Strain_No" AS strain_name, s."Specie" AS species,
                i.result, i.tested_by, i.date_tested, i.notes
             FROM ext_phage_host_interactions i
             JOIN ext_bacteriophages b ON b.id = i.phage_id
             LEFT JOIN phage_names n ON n."ID"::text = b."Bacteriophage_Name"::text
             JOIN ext_bacterial_strains s ON s.id = i.strain_id
             ORDER BY phage_name, s."Strain_No"`,
            { type: QueryTypes.SELECT }
        );
        res.json({ success: true, data: rows, count: rows.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
