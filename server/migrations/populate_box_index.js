const { Sequelize, QueryTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.PORT || 5432}/${process.env.DB_NAME}`,
    { logging: false }
);

// Constants
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Normalization Engine
function normalizePosition(posStr) {
    if (!posStr) return [];
    const positions = [];
    
    // Split by comma
    const parts = posStr.toString().split(',');
    for (let part of parts) {
        // Clean up string
        let cleaned = part.trim().toUpperCase().replace(/[\s-]/g, '');
        
        // Match Row (A-J) and Column (1-10)
        const match = cleaned.match(/^([A-J])(10|[1-9])$/);
        if (match) {
            positions.push({ row: match[1], col: parseInt(match[2], 10), original: part });
        } else {
            positions.push({ error: 'INVALID_FORMAT', original: part });
        }
    }
    return positions;
}

function normalizeBoxName(boxStr) {
    if (!boxStr) return null;
    return boxStr.toString().trim();
}

async function runMigration() {
    console.log('🚀 Starting Universal Box Matrix Migration (Phase 1 & 2)...');
    let report = {
        boxesCreated: 0,
        emptySlotsGenerated: 0,
        recordsProcessed: 0,
        successfulPlacements: 0,
        conflicts: 0,
        invalidPositions: 0
    };

    const transaction = await sequelize.transaction();

    try {
        console.log('📦 Setting up database schema... (Idempotent rebuild)');
        
        await sequelize.query(`DROP TABLE IF EXISTS box_position_index CASCADE;`, { transaction });
        
        await sequelize.query(`
            CREATE TABLE box_position_index (
                id SERIAL PRIMARY KEY,
                freezer_name VARCHAR(255),
                box_name VARCHAR(255) NOT NULL,
                row VARCHAR(2) NOT NULL,
                "column" INTEGER NOT NULL,
                position_code VARCHAR(10) NOT NULL,
                asset_type VARCHAR(50),
                asset_id INTEGER,
                asset_label VARCHAR(255),
                tube_label VARCHAR(255),
                source_table VARCHAR(100),
                is_occupied BOOLEAN DEFAULT false,
                conflict_flag BOOLEAN DEFAULT false,
                last_synced_source VARCHAR(100) DEFAULT 'migration_script_v1',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (box_name, row, "column")
            );
            
            CREATE INDEX idx_box_position_box ON box_position_index(box_name);
            CREATE INDEX idx_box_position_status ON box_position_index(is_occupied);
            CREATE INDEX idx_box_position_code ON box_position_index(position_code);
        `, { transaction });

        console.log('🔍 Discovering unique boxes across all legacy tables...');
        
        const boxQueries = [
            `SELECT DISTINCT TRIM("GS_Box_details") as box FROM ext_bacteriophages WHERE "GS_Box_details" IS NOT NULL AND TRIM("GS_Box_details") != ''`,
            `SELECT DISTINCT TRIM("DNA_storage_Box_detail") as box FROM ext_bacteriophages WHERE "DNA_storage_Box_detail" IS NOT NULL AND TRIM("DNA_storage_Box_detail") != ''`,
            `SELECT DISTINCT TRIM("GS_Box_details") as box FROM ext_bacterial_strains WHERE "GS_Box_details" IS NOT NULL AND TRIM("GS_Box_details") != ''`,
            `SELECT DISTINCT TRIM("GD_Box_detail") as box FROM ext_bacterial_strains WHERE "GD_Box_detail" IS NOT NULL AND TRIM("GD_Box_detail") != ''`,
            `SELECT DISTINCT TRIM("Glycerol_Stock_Box") as box FROM ext_plasmids WHERE "Glycerol_Stock_Box" IS NOT NULL AND TRIM("Glycerol_Stock_Box") != ''`,
            `SELECT DISTINCT TRIM("DNA_Store_Box_Detail") as box FROM ext_plasmids WHERE "DNA_Store_Box_Detail" IS NOT NULL AND TRIM("DNA_Store_Box_Detail") != ''`,
            `SELECT DISTINCT TRIM("Box_detail") as box FROM ext_primers_details WHERE "Box_detail" IS NOT NULL AND TRIM("Box_detail") != ''`
        ];

        let uniqueBoxes = new Set();
        for (let q of boxQueries) {
            const results = await sequelize.query(q, { type: QueryTypes.SELECT, transaction });
            results.forEach(r => uniqueBoxes.add(r.box));
        }

        console.log(`🏗️ Generating 100-slot grids for ${uniqueBoxes.size} unique boxes...`);
        let gridInserts = [];
        for (let box of uniqueBoxes) {
            report.boxesCreated++;
            for (let r of ROWS) {
                for (let c of COLS) {
                    gridInserts.push(`('${box.replace(/'/g, "''")}', '${r}', ${c}, '${r}${c}')`);
                    report.emptySlotsGenerated++;
                }
            }
        }
        
        if (gridInserts.length > 0) {
            // Batch insert in chunks of 5000
            const chunkSize = 5000;
            for (let i = 0; i < gridInserts.length; i += chunkSize) {
                const chunk = gridInserts.slice(i, i + chunkSize);
                await sequelize.query(`
                    INSERT INTO box_position_index (box_name, row, "column", position_code)
                    VALUES ${chunk.join(', ')}
                `, { transaction });
            }
        }

        console.log('💉 Injecting biological assets into the grid...');

        const sources = [
            {
                table: 'ext_bacteriophages', type: 'phage', labelCol: 'Bacteriophage_Name', tubeCol: 'Glycerol_Stock_tube_Label',
                mappings: [
                    { boxCol: 'GS_Box_details', posCol: 'GS_position_in_Box', freezerCol: 'GS_Freezer_Name' },
                    { boxCol: 'DNA_storage_Box_detail', posCol: '_4C_Position_in_box', freezerCol: null } // 4C position mapping is a guess, skipping if missing
                ]
            },
            {
                table: 'ext_bacterial_strains', type: 'bacteria', labelCol: 'Strain_No', tubeCol: 'Glycerol_Stock_tube_label',
                mappings: [
                    { boxCol: 'GS_Box_details', posCol: 'Location_in_Box_GS', freezerCol: 'GS_Freezer_Number' },
                    { boxCol: 'GD_Box_detail', posCol: 'Loction_in_Box_PD', freezerCol: 'GD_Freezer_Number' } 
                ]
            },
            {
                table: 'ext_plasmids', type: 'plasmid', labelCol: 'Plasmid_Name', tubeCol: 'Glycerol_Stock_Tube_Label',
                mappings: [
                    { boxCol: 'Glycerol_Stock_Box', posCol: 'Location_in_Box_GS', freezerCol: 'GLycerol_Stock_Freezer' },
                    { boxCol: 'DNA_Store_Box_Detail', posCol: 'Location_in_Box_GS', freezerCol: 'DNA_Store_Freezer' } // Need to check actual column name for position, assuming Location_in_Box_GS
                ]
            },
            {
                table: 'ext_primers_details', type: 'primer', labelCol: 'Primer_Name', tubeCol: 'Purpose',
                mappings: [
                    { boxCol: 'Box_detail', posCol: 'Location_in_Box', freezerCol: 'Freezer' }
                ]
            }
        ];

        for (let src of sources) {
            console.log(`   -> Processing ${src.table}...`);
            // Fetch records
            let colsToSelect = ['id'];
            if (src.labelCol && src.labelCol !== "Bacteriophage_Name") colsToSelect.push(`"${src.labelCol}"`);
            if (src.tubeCol) colsToSelect.push(`"${src.tubeCol}"`);
            
            for (let m of src.mappings) {
                colsToSelect.push(`"${m.boxCol}"`);
                if (m.posCol) colsToSelect.push(`"${m.posCol}"`);
                if (m.freezerCol) colsToSelect.push(`"${m.freezerCol}"`);
            }

            // Special case for Phages where name is a lookup
            let query = `SELECT ${colsToSelect.join(', ')} FROM ${src.table}`;
            if (src.table === 'ext_bacteriophages') {
                query = `
                    SELECT b.*, COALESCE(n."Bacteriophage_Name", b."Bacteriophage_Name"::text) as "resolved_label"
                    FROM ext_bacteriophages b
                    LEFT JOIN phage_names n ON n."ID"::text = b."Bacteriophage_Name"::text
                `;
            }

            const records = await sequelize.query(query, { type: QueryTypes.SELECT, transaction });
            
            for (let rec of records) {
                let assetLabel = src.table === 'ext_bacteriophages' ? rec.resolved_label : rec[src.labelCol];
                let tubeLabel = rec[src.tubeCol] || null;

                for (let m of src.mappings) {
                    let boxName = normalizeBoxName(rec[m.boxCol]);
                    let posStr = m.posCol ? rec[m.posCol] : null;
                    let freezerName = m.freezerCol ? rec[m.freezerCol] : null;

                    if (!boxName || !posStr) continue;

                    let positions = normalizePosition(posStr);
                    report.recordsProcessed++;

                    for (let p of positions) {
                        if (p.error) {
                            report.invalidPositions++;
                            // We can log invalid ones if needed
                            continue;
                        }

                        // Check existing slot safely
                        const [existing] = await sequelize.query(`
                            SELECT is_occupied, asset_label, source_table 
                            FROM box_position_index 
                            WHERE box_name = :box AND row = :row AND "column" = :col
                        `, { 
                            replacements: { box: boxName, row: p.row, col: p.col },
                            type: QueryTypes.SELECT,
                            transaction
                        });

                        if (!existing) {
                            // Should not happen since we generated all 10x10 grids, but just in case
                            continue; 
                        }

                        if (existing.is_occupied) {
                            // CONFLICT!
                            report.conflicts++;
                            const conflictNote = `[CONFLICT] Found: ${src.type} (${assetLabel}) from ${src.table}. Already occupied by: ${existing.asset_label} from ${existing.source_table}.`;
                            
                            await sequelize.query(`
                                UPDATE box_position_index 
                                SET conflict_flag = true,
                                    notes = CONCAT(COALESCE(notes, ''), '\n', :note)
                                WHERE box_name = :box AND row = :row AND "column" = :col
                            `, {
                                replacements: { box: boxName, row: p.row, col: p.col, note: conflictNote },
                                transaction
                            });
                        } else {
                            // SAFE UPDATE
                            await sequelize.query(`
                                UPDATE box_position_index 
                                SET is_occupied = true,
                                    asset_type = :type,
                                    asset_id = :id,
                                    asset_label = :label,
                                    tube_label = :tube,
                                    source_table = :source,
                                    freezer_name = COALESCE(freezer_name, :freezer),
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE box_name = :box AND row = :row AND "column" = :col
                            `, {
                                replacements: { 
                                    box: boxName, row: p.row, col: p.col, 
                                    type: src.type, id: rec.id, label: assetLabel, 
                                    tube: tubeLabel, source: src.table, freezer: freezerName
                                },
                                transaction
                            });
                            report.successfulPlacements++;
                        }
                    }
                }
            }
        }

        await transaction.commit();
        console.log('✅ Migration Transaction Committed Successfully.');

    } catch (error) {
        await transaction.rollback();
        console.error('❌ MIGRATION FAILED! Transaction rolled back completely.');
        console.error(error);
        process.exit(1);
    }

    console.log('\n📊 === FINAL MIGRATION REPORT ===');
    console.log(`- Boxes Discovered/Created: ${report.boxesCreated}`);
    console.log(`- Empty Slots Generated:    ${report.emptySlotsGenerated} (${report.boxesCreated * 100})`);
    console.log(`- Total Position Strings:   ${report.recordsProcessed}`);
    console.log(`- Successful Placements:    ${report.successfulPlacements}`);
    console.log(`- Conflicts Detected:       ${report.conflicts}`);
    console.log(`- Invalid Positions:        ${report.invalidPositions}`);
    console.log('===================================\n');
    process.exit(0);
}

runMigration();
