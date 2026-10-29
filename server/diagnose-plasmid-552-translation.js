const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'bacteriophage_lims',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'phagelabdrshafiq',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
    }
);

const LOOKUP_REGISTRY = {
    'Bacteriophage_Name':   { endpoint: '/lookup/phage-names',   table: 'phage_names',            col: 'Bacteriophage_Name' },
    'WT_RECOMB':            { endpoint: '/lookup/wild-type-recomb',       table: 'wild_type_recomb_types',      col: 'Field1' },
    'WT_RECOME':            { endpoint: '/lookup/wild-type-recomb',       table: 'wild_type_recomb_types',      col: 'Field1' },
    'Host_Bacteria':        { endpoint: '/lookup/host-bacteria',  table: 'ext_host_bacteria',       col: 'Host_Bacteria_No' },
    'Host_Range':           { endpoint: '/lookup/all-strains',    table: 'ext_bacterial_strains',   col: 'Strain_No', multiSelect: true },
    'Activity_Shown_Against': { endpoint: '/lookup/species',        table: 'bacterial_species',           col: 'Species' },
    'GS_Freezer_Name':      { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'GS_Racks':             { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'GS_Box_details':       { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'Against_Species':      { endpoint: '/lookup/species',        table: 'bacterial_species',           col: 'Species' },
    'DNA_storage_Box_detail': { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'Antibiotic_resistance':  { endpoint: '/lookup/antibiotics',  table: 'antibiotics',             col: 'Complete_Name', multiSelect: true },

    'Specie':               { endpoint: '/lookup/species',        table: 'bacterial_species',           col: 'Species' },
    'Wild_type_Recom':      { endpoint: '/lookup/wild-type-recomb',       table: 'wild_type_recomb_types',      col: 'Field1' },
    'GS_Freezer_Number':    { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'GS_Rack_Number':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'GS_Box_details':       { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'GD_Freezer_Number':    { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'GD_Rack_Number':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'GD_Box_detail':        { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
    'Antibiotic_sensitivity': { endpoint: '/lookup/antibiotics',  table: 'antibiotics',             col: 'Complete_Name', multiSelect: true },

    'Plasmid_Backbone':     { endpoint: '/lookup/plasmid-vectors', table: 'plasmid_vectors',        col: 'Plasmid_Name' },
    'Gene_Source':          { endpoint: '/lookup/gene-sources',   table: 'gene_sources',            col: 'Donar_DNA_detail' },
    'Cloning_Method':       { endpoint: '/lookup/cloning-methods', table: 'cloning_methods',        col: 'Cloninig_Method' },
    'Antibiotic_Marker':    { endpoint: '/lookup/antibiotics',    table: 'antibiotics',             col: 'Complete_Name' },
    'Freezer':      { endpoint: '/lookup/freezers',     table: 'freezer_locations',           col: 'Freezer' },
    'Rack_No':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'Box_detail':   { endpoint: '/lookup/boxes',        table: 'box_locations',               col: 'Box_detail' },
    'GLycerol_Stock_Freezer': { endpoint: '/lookup/freezers', table: 'freezer_locations',  col: 'Freezer'     },
    'Glycerol_Stock_Rack':    { endpoint: '/lookup/racks',    table: 'rack_locations',     col: 'Rack_No'     },
    'Glycerol_Stock_Box':     { endpoint: '/lookup/boxes',    table: 'box_locations',      col: 'Box_detail'  },

    'Binds_with_Phage_Bacteria_Plasmid': { endpoint: '/lookup/primer-binding-types', table: 'primer_binding_organism_types', col: 'Field1' },
    'Phage':        { endpoint: '/lookup/phages',       table: 'phage_names',             col: 'Bacteriophage_Name' },
    'Bacteria':     { endpoint: '/lookup/bacteria',     table: 'ext_bacterial_strains',   col: 'Strain_No' },
    'Plasmid':      { endpoint: '/lookup/plasmids',     table: 'plasmid_vectors',         col: 'Plasmid_Name' },
    'Freezer_Shelve': { endpoint: '/lookup/racks',      table: 'rack_locations',              col: 'Rack_No' },
    'DNA_Store_Freezer':    { endpoint: '/lookup/freezers',       table: 'freezer_locations',           col: 'Freezer' },
    'DNA_Store_Rack':       { endpoint: '/lookup/racks',          table: 'rack_locations',              col: 'Rack_No' },
    'DNA_Store_Box_Detail': { endpoint: '/lookup/boxes',          table: 'box_locations',               col: 'Box_detail' },
};

async function testTranslation() {
    try {
        console.log('=== Step 1: Fetch raw row for Plasmid 457 ===');
        const rows = await sequelize.query(`SELECT * FROM ext_plasmids WHERE id = 457`, { type: Sequelize.QueryTypes.SELECT });
        if (!rows.length) {
            console.log('Row 457 not found on local DB.');
            return;
        }

        const row = rows[0];
        console.log('Raw row 552 from DB:', row);

        console.log('\n=== Step 2: Check columns & matching dicts ===');
        const allColKeys = Object.keys(row);
        const normalizeK = (k) => k.toLowerCase().replace(/[\s-]/g, '_').replace(/s$/i, '');

        for (const colKey of allColKeys) {
            const rawVal = row[colKey];
            if (rawVal == null || String(rawVal).trim() === '') continue;

            const targetK = normalizeK(colKey);
            let regK = Object.keys(LOOKUP_REGISTRY).find(k => normalizeK(k) === targetK);
            let regEntry = regK ? LOOKUP_REGISTRY[regK] : null;

            if (!regEntry) {
                if (targetK.includes('rack'))         regEntry = { table: 'rack_locations',    col: 'Rack_No' };
                else if (targetK.includes('box'))     regEntry = { table: 'box_locations',     col: 'Box_detail' };
                else if (targetK.includes('freezer')) regEntry = { table: 'freezer_locations', col: 'Freezer' };
                else if (targetK.includes('specie') || targetK.includes('against'))  regEntry = { table: 'bacterial_species', col: 'Species' };
                else if (targetK.includes('phage'))   regEntry = { table: 'phage_names',       col: 'Bacteriophage_Name' };
                else if (targetK.includes('antibiotic')) regEntry = { table: 'antibiotics',   col: 'Complete_Name' };
                else if (targetK.includes('manufacturer')) regEntry = { table: 'manufacturers', col: 'Manufacturers' };
                else if (targetK.includes('category')) regEntry = { table: 'stock_categories', col: 'Category' };
                else if (targetK.includes('host'))    regEntry = { table: 'ext_host_bacteria', col: 'Host_Bacteria_No' };
            }

            if (regEntry) {
                const targetDesc = await sequelize.getQueryInterface().describeTable(regEntry.table);
                const idCols = [];
                if (targetDesc['id']) idCols.push('"id"');
                if (targetDesc['ID']) idCols.push('"ID"');

                const selectCols = [...new Set([...idCols, `"${regEntry.col}"`])].join(', ');
                const lookupResults = await sequelize.query(
                    `SELECT ${selectCols} FROM "${regEntry.table}" WHERE "${regEntry.col}" IS NOT NULL`,
                    { type: Sequelize.QueryTypes.SELECT }
                );

                const dict = {};
                lookupResults.forEach(r => {
                    const labelVal = r[regEntry.col];
                    if (!labelVal) return;
                    const labelStr = String(labelVal).trim();
                    if (r.id  != null) dict[String(r.id).trim()]  = labelStr;
                    if (r.ID  != null) dict[String(r.ID).trim()]  = labelStr;
                    dict[labelStr]                = labelStr;
                    dict[labelStr.toLowerCase()]  = labelStr;
                });

                const stringVal = String(rawVal).trim();
                const translated = dict[stringVal] ?? dict[stringVal.toLowerCase()] ?? rawVal;
                console.log(`Column "${colKey}": raw="${rawVal}" → translated="${translated}" (Table: ${regEntry.table})`);
            } else {
                console.log(`Column "${colKey}": raw="${rawVal}" → NOT RELATIONAL`);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

testTranslation();
