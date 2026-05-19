const { Sequelize, DataTypes } = require('sequelize');
const db = require('../models');

async function migrate() {
    function safeInt(val) {
        if (!val || val === '' || isNaN(parseInt(val))) return null;
        return parseInt(val);
    }
    try {
        console.log("Starting Migration...");
        
        // Disable constraints temporarily if needed, or just clear tables
        await db.sequelize.query('TRUNCATE TABLE "BiologicalAssets" CASCADE;');
        await db.sequelize.query('TRUNCATE TABLE "StorageLocations" CASCADE;');
        await db.sequelize.query('TRUNCATE TABLE "InventoryStocks" CASCADE;');
        
        // 1. Storage Locations & Inventory Stocks (Lab Stock)
        console.log("Migrating Lab Stock to InventoryStocks...");
        const lab_stocks = await db.sequelize.query(`SELECT * FROM ext_lab_stock`, { type: Sequelize.QueryTypes.SELECT });
        let stock_payloads = lab_stocks.map(row => ({
            item_name: row.Item_Name || 'Unknown',
            manufacturer_id: safeInt(row.Manufacturer),
            pack_size: row.Pack_Size,
            category_id: safeInt(row.Category),
            available_quantity: safeInt(row.Available_Quantity) || 0,
            location_area: row.Location_Area,
            location_details: row.Location_details,
            catalog_number: row.Cat__,
            source: 'Lab-Stock.accdb'
        }));
        await db.InventoryStock.bulkCreate(stock_payloads);
        console.log(`Lab Stock: ${lab_stocks.length}/329 migrated successfully`);

        // 2. Primers
        console.log("Migrating Primers to BiologicalAssets...");
        const primers = await db.sequelize.query(`SELECT * FROM ext_primers_details`, { type: Sequelize.QueryTypes.SELECT });
        let primer_assets = [];
        for (let p of primers) {
            let strain_no = p.Primer_Name ? p.Primer_Name.trim() : `Primer_${p.ID}`;
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
            primer_assets.push({
                type: 'Primer',
                strain_number: `${strain_no}_${p.ID}`, 
                sequence_data: p.DNA_sequence,
                characteristics: p.Purpose,
                host_strain_id: safeInt(p.Bacteria),
                storage_location_id: storageLocId
            });
        }
        await db.BiologicalAsset.bulkCreate(primer_assets);
        console.log(`Primers-details: ${primers.length}/1242 migrated successfully`);

        // 3. Strains
        console.log("Migrating Strains to BiologicalAssets...");
        const strains = await db.sequelize.query(`SELECT * FROM ext_bacterial_strains`, { type: Sequelize.QueryTypes.SELECT });
        let strain_assets = [];
        for (let s of strains) {
            let strain_no = s.Strain_No ? s.Strain_No.trim() : `Strain_${s.ID}`;
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
            strain_assets.push({
                type: 'Strain',
                strain_number: `${strain_no}_S_${s.ID}`,
                species_id: safeInt(s.Specie),
                wild_type_id: safeInt(s.Wild_type_Recom),
                characteristics: s.Detail_of_Bacterial_Strain,
                storage_location_id: storageLocId
            });
        }
        await db.BiologicalAsset.bulkCreate(strain_assets);
        console.log(`Bacterial Strains: ${strains.length}/1212 migrated successfully`);

        // 4. Plasmids
        console.log("Migrating Plasmids to BiologicalAssets...");
        const plasmids = await db.sequelize.query(`SELECT * FROM ext_plasmids`, { type: Sequelize.QueryTypes.SELECT });
        let plasmid_assets = [];
        for (let p of plasmids) {
            let strain_no = p.Plasmid_Name ? p.Plasmid_Name.trim() : `Plasmid_${p.ID}`;
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
            plasmid_assets.push({
                type: 'Plasmid',
                strain_number: `${strain_no}_P_${p.ID}`,
                plasmid_vector_id: safeInt(p.Plasmid_Backbone),
                gene_source_id: safeInt(p.Gene_Source),
                cloning_method_id: safeInt(p.Cloning_Method),
                antibiotic_marker_id: safeInt(p.Antibiotic_Marker),
                sequence_data: p.Cloned_Gene_Sequence,
                host_strain_id: safeInt(p.Host_Bacteria),
                storage_location_id: storageLocId
            });
        }
        await db.BiologicalAsset.bulkCreate(plasmid_assets);
        console.log(`Plasmids: ${plasmids.length}/451 migrated successfully`);

        // 5. Phages
        console.log("Migrating Phages to BiologicalAssets...");
        const phages = await db.sequelize.query(`SELECT * FROM ext_bacteriophages`, { type: Sequelize.QueryTypes.SELECT });
        let phage_assets = [];
        for (let p of phages) {
            let strain_no = p.Bacteriophage_Name ? p.Bacteriophage_Name.trim() : `Phage_${p.ID}`;
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
            phage_assets.push({
                type: 'Phage',
                strain_number: `${strain_no}_PH_${p.ID}`, 
                phage_name_id: safeInt(p.Bacteriophage_Name),
                wild_type_id: safeInt(p.WT_RECOMB),
                host_strain_id: safeInt(p.Host_Bacteria),
                characteristics: p.Characterization_details,
                storage_location_id: storageLocId
            });
        }
        await db.BiologicalAsset.bulkCreate(phage_assets);
        console.log(`Bacteriophages: ${phages.length}/210 migrated successfully`);
               
        // VERIFICATION
        const cPhages = await db.BiologicalAsset.count({ where: { type: 'Phage' }});
        const cStrains = await db.BiologicalAsset.count({ where: { type: 'Strain' }});
        const cPlasmids = await db.BiologicalAsset.count({ where: { type: 'Plasmid' }});
        const cPrimers = await db.BiologicalAsset.count({ where: { type: 'Primer' }});
        const cLabStock = await db.InventoryStock.count();
        
        console.log("\n--- VERIFICATION CHECKSUMS ---");
        console.log(`Bacteriophages: ${cPhages} / 210`);
        console.log(`Bacterial Strains: ${cStrains} / 1212`);
        console.log(`Primers-details: ${cPrimers} / 1242`);
        console.log(`Plasmids: ${cPlasmids} / 451`);
        console.log(`Lab-Stock: ${cLabStock} / 329`);
        
    } catch (e) {
        console.error("Migration Error:", e);
    } finally {
        process.exit();
    }
}
migrate();
