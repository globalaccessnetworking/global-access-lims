const sequelize = require('./config/database');

const CORE_SCHEMAS = {
    ext_bacteriophages: [
        'Bacteriophage_Name', 'Against_Species', 'Host_Bacteria', 'Genome_Size', 'Host_Range', 'WT_RECOMB',
        'Glycerol_Stock_tube_Label', 'GS_Freezer_Name', 'GS_Racks', 'GS_Box_details', 'GS_position_in_Box',
        '_4C_Stock_detail', '_4C_Fridge_Number', '_4C_Rack_Number', '_4C_Position_in_box',
        'DNA_Storage_Label', 'DNA_storage_Box_detail', 'Characterization_details', 'Plaque_Morphology', 'Antibiotic_resistance',
        'plaque_assay_result'
    ],
    ext_bacterial_strains: [
        'Strain_No', 'Specie', 'Wild_type_Recom', 'Genomic_DNA_tube_Label', 
        'GD_Freezer_Number', 'GD_Rack_Number', 'GD_Box_detail', 'Loction_in_Box_PD',
        'Glycerol_Stock_tube_label', 'GS_Freezer_Number', 'GS_Rack_Number', 
        'GS_Box_details', 'Location_in_Box_GS', 'Antibiotic_sensitivity', 
        'Antibiotic_resistance', 'Detail_of_Bacterial_Strain'
    ],
    ext_plasmids: [
        'ID', 'Plasmid_Name', 'Plasmid_Backbone', 'Gene_Source', 'Cloning_Method', 
        'Antibiotic_Marker', 'Cloned_Gene_Sequence', 'Cloned_Protein_Sequence', 
        'Host_Bacteria', 'Activity_Shown_Against', 'Glycerol_Stock_Tube_Label', 
        'GLycerol_Stock_Freezer', 'Glycerol_Stock_Rack', 'Glycerol_Stock_Box', 
        'Location_in_Box_GS', 'PLasmid_DNA_Label', 'DNA_Store_Freezer', 
        'DNA_Store_Rack', 'DNA_Store_Box_Detail', 'Protein_Purification_status',
        'Expression_Picture', 'Purified_Protein_Picture'
    ],
    ext_primers_details: [
        'ID', 'Primer_Name', 'DNA_sequence', 'Purpose',
        'Binds_with_Phage_Bacteria_Plasmid', 'Phage', 'Bacteria', 'Plasmid',
        'Freezer', 'Freezer_Shelve', 'Box_detail', 'Location_in_Box',
        'Primer_Image', 'Attachment_File'
    ]
};

async function alignDatabaseSchemas() {
    try {
        await sequelize.authenticate();
        console.log('⚡ Connected to PostgreSQL database...');

        for (const [tableName, columns] of Object.entries(CORE_SCHEMAS)) {
            console.log(`\n🔍 Checking schema for table "${tableName}"...`);

            // Verify if table exists
            const [tableCheck] = await sequelize.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                      AND table_name = '${tableName}'
                );
            `);

            if (!tableCheck[0]?.exists) {
                console.log(`❌ Table "${tableName}" does not exist. Creating table...`);
                // Create minimal table with id
                await sequelize.query(`CREATE TABLE "${tableName}" (id SERIAL PRIMARY KEY);`);
            }

            // Get existing columns
            const [existingColsRows] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = '${tableName}';
            `);
            const existingColumns = existingColsRows.map(row => row.column_name);

            // Add missing columns
            for (const col of columns) {
                if (!existingColumns.includes(col)) {
                    console.log(`   ➕ Adding column "${col}" to "${tableName}"...`);
                    // Use double quotes for case-sensitivity and characters
                    await sequelize.query(`ALTER TABLE "${tableName}" ADD COLUMN "${col}" TEXT;`);
                }
            }
            console.log(`✅ Table "${tableName}" is perfectly aligned and up to date!`);
        }

        console.log('\n🎉 ALL DATABASE SCHEMAS ALIGNED PERFECTLY WITH FRONTEND FIELDS!');
        process.exit(0);
    } catch (err) {
        console.error('❌ SCHEMA ALIGNMENT FAILED:', err.message);
        process.exit(1);
    }
}

alignDatabaseSchemas();
