const { Sequelize } = require('sequelize');
const db = require('../models');

async function migrate() {
    function safeInt(val) {
        if (!val || val === '' || isNaN(parseInt(val))) return null;
        return parseInt(val);
    }

    try {
        console.log("---------------------------------------------------------");
        console.log("PHASE 114: UNIVERSAL DATA MIGRATION COMMENCING...");
        console.log("---------------------------------------------------------");

        // 0. CLEAN SLATE
        console.log("[0/5] Cleaning existing relational tables...");
        await db.sequelize.query('TRUNCATE TABLE "BiologicalAssets" CASCADE;');
        await db.sequelize.query('TRUNCATE TABLE "StorageLocations" CASCADE;');
        await db.sequelize.query('TRUNCATE TABLE "InventoryStocks" CASCADE;');

        // 1. LAB STOCK -> InventoryStocks
        console.log("[1/5] Processing LAB STOCK records...");
        const rawLabStock = await db.sequelize.query('SELECT * FROM ext_lab_stock', { type: Sequelize.QueryTypes.SELECT });
        let stockCount = 0;
        for (let row of rawLabStock) {
            await db.InventoryStock.create({
                item_name: row.Item_Name || 'Unknown Item',
                manufacturer_id: safeInt(row.Manufacturer),
                pack_size: row.Pack_Size,
                category_id: safeInt(row.Category),
                available_quantity: safeInt(row.Available_Quantity) || 0,
                location_area: row.Location_Area,
                location_details: row.Location_details,
                catalog_number: row.Cat__,
                source: 'Lab-Stock MS Access'
            });
            stockCount++;
            if (stockCount % 100 === 0) console.log(`   > Migrated ${stockCount}/${rawLabStock.length} Lab Stock records...`);
        }
        console.log(`[SUCCESS] Migrated ${stockCount} Lab Stock records.`);

        // 2. PRIMERS -> BiologicalAssets
        console.log("[2/5] Processing PRIMER records...");
        const rawPrimers = await db.sequelize.query('SELECT * FROM ext_primers_details', { type: Sequelize.QueryTypes.SELECT });
        let primerCount = 0;
        for (let p of rawPrimers) {
            let storageLocId = null;
            if (p.Freezer || p.Box_detail || p.Location_in_Box) {
                const loc = await db.StorageLocation.create({
                    freezer_id: safeInt(p.Freezer),
                    box_id: safeInt(p.Box_detail),
                    position: p.Location_in_Box || '',
                    freezer_name: '', rack: '', box: ''
                });
                storageLocId = loc.id;
            }

            await db.BiologicalAsset.create({
                type: 'Primer',
                strain_number: `${(p.Primer_Name || 'PRIMER').trim()}_${p.ID}`,
                sequence_data: p.DNA_sequence,
                characteristics: p.Purpose,
                host_strain_id: safeInt(p.Bacteria),
                storage_location_id: storageLocId
            });
            primerCount++;
            if (primerCount % 100 === 0) console.log(`   > Migrated ${primerCount}/${rawPrimers.length} Primer records...`);
        }
        console.log(`[SUCCESS] Migrated ${primerCount} Primer records.`);

        // 3. BACTERIAL STRAINS -> BiologicalAssets
        console.log("[3/5] Processing BACTERIAL STRAINS records...");
        const rawStrains = await db.sequelize.query('SELECT * FROM ext_bacterial_strains', { type: Sequelize.QueryTypes.SELECT });
        let strainCount = 0;
        for (let s of rawStrains) {
            let storageLocId = null;
            if (s.GS_Freezer_Number || s.GS_Rack_Number || s.GS_Box_details || s.Location_in_Box_GS) {
                const loc = await db.StorageLocation.create({
                    freezer_id: safeInt(s.GS_Freezer_Number),
                    rack_id: safeInt(s.GS_Rack_Number),
                    box_id: safeInt(s.GS_Box_details),
                    position: s.Location_in_Box_GS || '',
                    freezer_name: '', rack: '', box: ''
                });
                storageLocId = loc.id;
            }

            await db.BiologicalAsset.create({
                type: 'Strain',
                strain_number: `${(s.Strain_No || 'STRAIN').trim()}_S_${s.ID}`,
                species_id: safeInt(s.Specie),
                wild_type_id: safeInt(s.Wild_type_Recom),
                characteristics: s.Detail_of_Bacterial_Strain,
                storage_location_id: storageLocId
            });
            strainCount++;
            if (strainCount % 100 === 0) console.log(`   > Migrated ${strainCount}/${rawStrains.length} Strain records...`);
        }
        console.log(`[SUCCESS] Migrated ${strainCount} Strain records.`);

        // 4. PLASMIDS -> BiologicalAssets
        console.log("[4/5] Processing PLASMID records...");
        const rawPlasmids = await db.sequelize.query('SELECT * FROM ext_plasmids', { type: Sequelize.QueryTypes.SELECT });
        let plasmidCount = 0;
        for (let p of rawPlasmids) {
            let storageLocId = null;
            if (p.GLycerol_Stock_Freezer || p.Glycerol_Stock_Rack || p.Glycerol_Stock_Box || p.Location_in_Box_GS) {
                const loc = await db.StorageLocation.create({
                    freezer_id: safeInt(p.GLycerol_Stock_Freezer),
                    rack_id: safeInt(p.Glycerol_Stock_Rack),
                    box_id: safeInt(p.Glycerol_Stock_Box),
                    position: p.Location_in_Box_GS || '',
                    freezer_name: '', rack: '', box: ''
                });
                storageLocId = loc.id;
            }

            await db.BiologicalAsset.create({
                type: 'Plasmid',
                strain_number: `${(p.Plasmid_Name || 'PLASMID').trim()}_P_${p.ID}`,
                plasmid_vector_id: safeInt(p.Plasmid_Backbone),
                gene_source_id: safeInt(p.Gene_Source),
                cloning_method_id: safeInt(p.Cloning_Method),
                antibiotic_marker_id: safeInt(p.Antibiotic_Marker),
                sequence_data: p.Cloned_Gene_Sequence,
                host_strain_id: safeInt(p.Host_Bacteria),
                storage_location_id: storageLocId
            });
            plasmidCount++;
            if (plasmidCount % 100 === 0) console.log(`   > Migrated ${plasmidCount}/${rawPlasmids.length} Plasmid records...`);
        }
        console.log(`[SUCCESS] Migrated ${plasmidCount} Plasmid records.`);

        // 5. BACTERIOPHAGES -> BiologicalAssets
        console.log("[5/5] Processing BACTERIOPHAGE records...");
        const rawPhages = await db.sequelize.query('SELECT * FROM ext_bacteriophages', { type: Sequelize.QueryTypes.SELECT });
        let phageCount = 0;
        for (let p of rawPhages) {
            let storageLocId = null;
            if (p.GS_Freezer_Name || p.GS_Racks || p.GS_Box_details || p.GS_position_in_Box) {
                const loc = await db.StorageLocation.create({
                    freezer_id: safeInt(p.GS_Freezer_Name),
                    rack_id: safeInt(p.GS_Racks),
                    box_id: safeInt(p.GS_Box_details),
                    position: p.GS_position_in_Box || '',
                    freezer_name: '', rack: '', box: ''
                });
                storageLocId = loc.id;
            }

            await db.BiologicalAsset.create({
                type: 'Phage',
                strain_number: `${(p.Bacteriophage_Name || 'PHAGE').trim()}_PH_${p.ID}`,
                phage_name_id: safeInt(p.Bacteriophage_Name),
                wild_type_id: safeInt(p.WT_RECOMB),
                host_strain_id: safeInt(p.Host_Bacteria),
                characteristics: p.Characterization_details,
                storage_location_id: storageLocId
            });
            phageCount++;
            if (phageCount % 100 === 0) console.log(`   > Migrated ${phageCount}/${rawPhages.length} Phage records...`);
        }
        console.log(`[SUCCESS] Migrated ${phageCount} Phage records.`);

        console.log("---------------------------------------------------------");
        console.log("FINAL MIGRATION SUMMARY:");
        console.log(`Bacteriophages: ${phageCount} / 210`);
        console.log(`Bacterial Strains: ${strainCount} / 1212`);
        console.log(`Primers-details: ${primerCount} / 1242`);
        console.log(`Plasmids: ${plasmidCount} / 451`);
        console.log(`Lab-Stock: ${stockCount} / 329`);
        console.log("---------------------------------------------------------");
        console.log("MIGRATION COMPLETE.");

    } catch (err) {
        console.error("FATAL MIGRATION ERROR:", err);
    } finally {
        process.exit();
    }
}

migrate();
