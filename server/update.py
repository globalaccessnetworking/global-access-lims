import re

with open(r'd:\Bacteriophage_LIMS\server\routes\system.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_syncBoxIndex = '''async function syncBoxIndex(tableName, record) {
    const config = {
        ext_bacteriophages: { 
            type: 'phage', 
            label: record.Bacteriophage_Name, 
            mappings: [ 
                { box: record.GS_Box_details, pos: record.GS_position_in_Box, tube: record.Glycerol_Stock_tube_Label }, 
                { box: record.DNA_storage_Box_detail, pos: record._4C_Position_in_box, tube: record.DNA_Storage_Label } 
            ] 
        },
        ext_bacterial_strains: { 
            type: 'bacteria', 
            label: record.Strain_No, 
            mappings: [ 
                { box: record.GS_Box_details, pos: record.Location_in_Box_GS, tube: record.Glycerol_Stock_tube_label }, 
                { box: record.GD_Box_detail, pos: record.Loction_in_Box_PD, tube: record.Genomic_DNA_tube_Label } 
            ] 
        },
        ext_plasmids: { 
            type: 'plasmid', 
            label: record.Plasmid_Name, 
            mappings: [ 
                { box: record.Glycerol_Stock_Box, pos: record.Location_in_Box_GS, tube: record.Glycerol_Stock_Tube_Label }, 
                { box: record.DNA_Store_Box_Detail, pos: record.Location_in_Box_GS, tube: record.PLasmid_DNA_Label } 
            ] 
        },
        ext_primers_details: { 
            type: 'primer', 
            label: record.Primer_Name, 
            mappings: [ 
                { box: record.Box_detail, pos: record.Location_in_Box, tube: record.Purpose } 
            ] 
        }
    };

    const c = config[tableName];
    if (!c) return;

    // Clear all existing slots for this asset in the index
    await sequelize.query(\
        UPDATE box_position_index 
        SET is_occupied = false, asset_type = NULL, asset_id = NULL, asset_label = NULL, tube_label = NULL, source_table = NULL 
        WHERE source_table = :table AND asset_id = :id
    \, { replacements: { table: tableName, id: record.id } });

    // Set new slots
    for (let m of c.mappings) {
        if (!m.box || !m.pos) continue;
        const resolvedBoxName = await resolveBoxName(m.box);
        if (!resolvedBoxName) {
            console.warn(\[syncBoxIndex] Could not resolve box "\" for table \ record \\);
            continue;
        }
        let posArray = m.pos.split(',').map(p => p.trim().toUpperCase().replace(/[\s-]/g, ''));
        for (let posStr of posArray) {
            await sequelize.query(\
                UPDATE box_position_index 
                SET is_occupied = true, asset_type = :type, asset_id = :id, asset_label = :label, tube_label = :tube, source_table = :table, conflict_flag = false, updated_at = CURRENT_TIMESTAMP
                WHERE box_name = :box AND position_code = :pos
            \, { 
                replacements: { 
                    type: c.type, 
                    id: record.id, 
                    label: c.label || '', 
                    tube: m.tube || '', 
                    table: tableName, 
                    box: resolvedBoxName, 
                    pos: posStr 
                }
            });
            console.log(\[syncBoxIndex] Updated slot \/\ for \ id=\ label="\" tube="\"\);
        }
    }
}'''

pattern = re.compile(r'async function syncBoxIndex\(tableName, record\) \{.*?\n\}', re.DOTALL)
new_content, count = pattern.subn(new_syncBoxIndex, content)

if count > 0:
    with open(r'd:\Bacteriophage_LIMS\server\routes\system.js', 'w', encoding='utf-8', newline='\n') as f:
        f.write(new_content)
    print(f'Successfully replaced {count} occurrence(s).')
else:
    print('Failed to find syncBoxIndex block.')
