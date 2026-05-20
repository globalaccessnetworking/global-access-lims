const { QueryTypes } = require('sequelize');

// GET /api/bio
exports.getBioLibrary = async (req, res) => {
    try {
        const { sequelize } = require('../models');
        const { search = '' } = req.query;
        const searchPattern = `%${search}%`;

        // [PHASE 138] Deep Schema Debugging
        // 1. Quoting table & column names for PostgreSQL Case Sensitivity.
        // 2. Removing "created_at" as it is missing from legacy tables (causing silent failure).
        
        const [strains, phages, primers, plasmids] = await Promise.all([
            // 1. Bacterial Strains (Table: ext_bacterial_strains)
            sequelize.query(
                `SELECT "id", "Strain_No", "Specie", "Glycerol_Stock_tube_label", "Detail_of_Bacterial_Strain" 
                 FROM "ext_bacterial_strains" 
                 WHERE "Strain_No" ILIKE :search OR "Specie" ILIKE :search`,
                { replacements: { search: searchPattern }, type: QueryTypes.SELECT }
            ).catch(err => { console.error('STRAINS QUERY ERROR:', err.message); return []; }),

            // 2. Bacteriophages (Table: ext_bacteriophages) - [PHASE 139 FIX]
            sequelize.query(
                `SELECT "id", "Bacteriophage_Name", "Host_Bacteria", "GS_Box_details", "Genome_Size", "plaque_assay_result" 
                 FROM "ext_bacteriophages" 
                 WHERE "Bacteriophage_Name" ILIKE :search OR "Host_Bacteria" ILIKE :search`,
                { replacements: { search: searchPattern }, type: QueryTypes.SELECT }
            ).catch(err => { 
                console.error('PHAGES QUERY ERROR (PHASE 139):', err.message); 
                return []; 
            }),

            // 3. Primers (Table: ext_primers_details)
            sequelize.query(
                `SELECT "id", "Primer_Name", "Binds_with_Phage_Bacteria_Plasmid", "Box_detail", "DNA_sequence" 
                 FROM "ext_primers_details" 
                 WHERE "Primer_Name" ILIKE :search OR "Purpose" ILIKE :search`,
                { replacements: { search: searchPattern }, type: QueryTypes.SELECT }
            ).catch(err => { console.error('PRIMERS QUERY ERROR:', err.message); return []; }),

            // 4. Plasmids (Table: ext_plasmids)
            sequelize.query(
                `SELECT "id", "Plasmid_Name", "Host_Bacteria", "Glycerol_Stock_Tube_Label", "Gene_Source" 
                 FROM "ext_plasmids" 
                 WHERE "Plasmid_Name" ILIKE :search OR "Host_Bacteria" ILIKE :search`,
                { replacements: { search: searchPattern }, type: QueryTypes.SELECT }
            ).catch(err => { console.error('PLASMIDS QUERY ERROR:', err.message); return []; })
        ]);

        console.log(`[DEBUG] RAW FETCH: Strains: ${strains.length}, Phages: ${phages.length}, Primers: ${primers.length}, Plasmids: ${plasmids.length}`);

        // Standardized JavaScript Mapping (Strict UPPERCASE Types)
        const mappedStrains = strains.map(s => ({
            asset_id: s.id,
            name: s.Strain_No,
            type: 'STRAIN',
            specie_host: s.Specie,
            box: s.Glycerol_Stock_tube_label || 'Unassigned',
            concentration: s.Detail_of_Bacterial_Strain || '',
            createdAt: null
        }));

        const mappedPhages = phages.map(p => ({
            asset_id: p.id,
            name: p.Bacteriophage_Name,
            type: 'PHAGE',
            specie_host: p.Host_Bacteria,
            box: p.GS_Box_details || 'Unassigned',
            concentration: p.Genome_Size || '',
            plaque_assay_result: p.plaque_assay_result || null,
            createdAt: null
        }));

        const mappedPrimers = primers.map(pr => ({
            asset_id: pr.id,
            name: pr.Primer_Name,
            type: 'PRIMER',
            specie_host: pr.Binds_with_Phage_Bacteria_Plasmid,
            box: pr.Box_detail || 'Unassigned',
            concentration: pr.DNA_sequence || '',
            createdAt: null
        }));

        const mappedPlasmids = plasmids.map(pl => ({
            asset_id: pl.id,
            name: pl.Plasmid_Name,
            type: 'PLASMID',
            specie_host: pl.Host_Bacteria,
            box: pl.Glycerol_Stock_Tube_Label || 'Unassigned',
            concentration: pl.Gene_Source || '',
            createdAt: null
        }));

        // Merge all assets and sort by ID descending (Latest first fallback)
        const mergedArray = [
            ...mappedStrains,
            ...mappedPhages,
            ...mappedPrimers,
            ...mappedPlasmids
        ].sort((a, b) => b.asset_id - a.asset_id);

        console.log("MERGED DATA LENGTH:", mergedArray.length);

        res.json({
            success: true,
            assets: mergedArray.slice(0, 2500),
            stats: {
                total: mergedArray.length,
                strains: mappedStrains.length,
                phages: mappedPhages.length,
                primers: mappedPrimers.length,
                plasmids: mappedPlasmids.length
            }
        });

    } catch (error) {
        console.error("BIO LIBRARY DB ERROR:", error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to aggregate biological repository data',
            details: error.message 
        });
    }
};

// GET /api/bio/detail/:type/:id - Deep Asset Retrieval
exports.getAssetDetail = async (req, res) => {
    try {
        const { sequelize, CustomForm } = require('../models');
        const { type, id } = req.params;
        console.log(`[QUICK-EDIT] Deep Discovery Triggered: Type=${type}, ID=${id}`);

        const tableMap = {
            'PHAGE': 'ext_bacteriophages',
            'STRAIN': 'ext_bacterial_strains',
            'PRIMER': 'ext_primers_details',
            'PLASMID': 'ext_plasmids'
        };

        const targetTable = tableMap[type.toUpperCase()];
        if (!targetTable) return res.status(400).json({ error: "Invalid Asset Classification" });

        // 1. Fetch the raw record (Using ::text cast for universal ID compatibility)
        let record = null;
        try {
            const results = await sequelize.query(
                `SELECT * FROM "${targetTable}" WHERE "id"::text = :id`,
                { replacements: { id: String(id) }, type: QueryTypes.SELECT }
            );
            record = results && results.length > 0 ? results[0] : null;
        } catch (dbErr) {
            console.error(`[QUICK-EDIT] DB Query Failure for ${targetTable}:`, dbErr.message);
            return res.status(500).json({ error: "Database query failed", debug: dbErr.message });
        }

        if (!record) return res.status(404).json({ error: "Research record not found" });

        // 2. Resolve Relational Labels (New Expansion Logic - Phase 173)
        // This resolves numeric IDs into human-readable clinical names for display
        const displayValues = {};
        const FIELD_LOOKUP_MAP = {
            'Host_Bacteria': { table: 'ext_host_bacteria', label: 'Host_Bacteria_No', idCol: 'id' },
            'Against_Species': { table: 'bacterial_species', label: 'Species', idCol: 'ID' },
            'WT_RECOMB': { table: 'wild_type_recomb_types', label: 'Field1', idCol: 'ID' },
            'WT-RECOMB': { table: 'wild_type_recomb_types', label: 'Field1', idCol: 'ID' },
            'GS_Freezer_Name': { table: 'freezer_locations', label: 'Freezer', idCol: 'ID' },
            '4C_Fridge_Number': { table: 'freezer_locations', label: 'Freezer', idCol: 'ID' },
            'GS_Racks': { table: 'rack_locations', label: 'Rack_No', idCol: 'ID' },
            '_4C_Rack_Number': { table: 'rack_locations', label: 'Rack_No', idCol: 'ID' },
            'GS_Box_details': { table: 'box_locations', label: 'Box_detail', idCol: 'ID' },
            'DNA_storage_Box_detail': { table: 'freezer_locations', label: 'Freezer', idCol: 'ID' }
        };

        try {
            const lookupKeys = Object.keys(record).filter(k => FIELD_LOOKUP_MAP[k] && record[k]);
            if (lookupKeys.length > 0) {
                await Promise.all(lookupKeys.map(async (key) => {
                    const lookup = FIELD_LOOKUP_MAP[key];
                    try {
                        const results = await sequelize.query(
                            `SELECT "${lookup.label}" as label FROM "${lookup.table}" WHERE "${lookup.idCol}"::text = :id LIMIT 1`,
                            { replacements: { id: String(record[key]) }, type: QueryTypes.SELECT }
                        );
                        if (results && results[0]) {
                            displayValues[key] = results[0].label;
                        }
                    } catch (lErr) { /* Quiet failure for non-critical lookups */ }
                }));
            }
        } catch (expansionErr) {
            console.warn(`[QUICK-EDIT] Relational expansion encountered non-fatal issues:`, expansionErr.message);
        }

        // 3. Resolve the Form Architect Schema (Safety Block)
        let schemaJson = null;
        try {
            if (CustomForm) {
                const schema = await CustomForm.findOne({
                    where: { table_name: targetTable, status: 'Published' }
                });
                schemaJson = schema ? schema.schema_json : null;
            }
        } catch (schemaErr) {
            console.warn(`[QUICK-EDIT] Schema Resolution non-fatal error:`, schemaErr.message);
        }

        res.json({
            success: true,
            data: record,
            displayValues,
            schema: schemaJson,
            tableName: targetTable
        });

    } catch (err) {
        console.error("[QUICK-EDIT] UNIVERSAL ERROR IN getAssetDetail:", err);
        res.status(500).json({ error: "Failed to resolve record details", debug: err.message });
    }
};

// PATCH /api/bio/detail/:type/:id - Granular Asset Update
exports.updateAssetDetail = async (req, res) => {
    try {
        const { sequelize, SystemAuditLog } = require('../models');
        const { type, id } = req.params;
        const updates = req.body;
        console.log(`[QUICK-EDIT] Update Triggered for ${type} #${id}`, updates);

        const tableMap = {
            'PHAGE': 'ext_bacteriophages',
            'STRAIN': 'ext_bacterial_strains',
            'PRIMER': 'ext_primers_details',
            'PLASMID': 'ext_plasmids'
        };

        const targetTable = tableMap[type.toUpperCase()];
        if (!targetTable) return res.status(400).json({ error: "Invalid Update Domain" });

        // Filter out system/primary key columns so we never mutate the PK
        const filteredUpdates = { ...updates };
        delete filteredUpdates.id;
        delete filteredUpdates.ID;
        delete filteredUpdates.createdAt;
        delete filteredUpdates.updatedAt;

        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({ error: "No updatable fields provided." });
        }

        // Use POSITIONAL parameters ($1, $2...) instead of named params to avoid
        // PostgreSQL "syntax error at or near ':'" for column names like _4C_Stock_detail
        const keys = Object.keys(filteredUpdates);
        const values = keys.map(k => filteredUpdates[k]);

        const setClause = keys
            .map((key, i) => `"${key}" = $${i + 1}`)
            .join(', ');

        // The id goes in the last positional slot
        await sequelize.query(
            `UPDATE "${targetTable}" SET ${setClause} WHERE "id"::text = $${keys.length + 1}`,
            { bind: [...values, String(id)], type: QueryTypes.UPDATE }
        );

        // Audit log is non-critical — never block the save if it fails
        try {
            if (SystemAuditLog) {
                await SystemAuditLog.create({
                    user_id: req.user?.id || null,
                    action: 'QUICK_EDIT',
                    table_name: targetTable,
                    details: { record_id: id, fields: Object.keys(filteredUpdates) }
                });
            }
        } catch (auditErr) {
            console.warn('[QUICK-EDIT] Audit log write failed (non-critical):', auditErr.message);
        }

        res.json({ success: true, message: "Sync Success" });

    } catch (err) {
        console.error("[QUICK-EDIT] ERROR IN updateAssetDetail:", err);
        res.status(500).json({ 
            error: err.message || "Failed to synchronize research metadata",
            debug: err.message 
        });
    }
};

