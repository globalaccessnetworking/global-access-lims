const db = require('../models');
const { Sequelize } = require('sequelize');

// Core modules configuration remains the same
const CORE_MODULES = [
    { name: 'Phage Library', type: 'BiologicalAsset', isCore: true, icon: 'Bug', path: '/repository/phages' },
    { name: 'Host Strains', type: 'BiologicalAsset', isCore: true, icon: 'Disc', path: '/repository/strains' },
    { name: 'Plasmids', type: 'BiologicalAsset', isCore: true, icon: 'Zap', path: '/repository/plasmids' },
    { name: 'Primers', type: 'BiologicalAsset', isCore: true, icon: 'Activity', path: '/repository/primers' },
    { name: 'Inventory Hub', type: 'InventoryStock', isCore: true, icon: 'Package', path: '/inventory/hub' }
];

exports.getModuleList = async (req, res) => {
    try {
        // Fetch ALL tables in public schema to avoid LIKE issues
        const results = await db.sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
            { type: Sequelize.QueryTypes.SELECT }
        );

        const dynamicModules = results
            .map(row => {
                let tableName;
                if (Array.isArray(row)) tableName = row[0];
                else if (typeof row === 'object' && row.table_name) tableName = row.table_name;
                else if (typeof row === 'string') tableName = row;

                if (!tableName) return null;

                // Include ext_ tables AND lookup tables that aren't core or system
                const isExt = tableName.startsWith('ext_');
                const lookupTables = [
                    'bacterial_species', 'phage_names', 'manufacturers', 'stock_categories', 
                    'freezer_locations', 'rack_locations', 'box_locations', 'cloning_methods', 
                    'gene_sources', 'plasmid_vectors', 'antibiotics', 'wild_type_recomb_types',
                    'primer_binding_organism_types', 'lytic_lysogenic_types'
                ];
                const isLookup = lookupTables.includes(tableName);

                if (!isExt && !isLookup) return null;

                // Exclude core tables that are already handled by custom pages
                const migratedTables = [
                    'ext_bacteriophages', 'ext_bacterial_strains', 'ext_plasmids', 
                    'ext_primers_details', 'ext_primers', 'ext_lab_stock'
                ];
                if (migratedTables.includes(tableName)) return null;

                // Friendly name generation: ext_bacteriophages -> Bacteriophages
                let displayName = tableName
                    .replace('ext_', '')
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                if (isLookup) displayName += ' (Metadata)';

                return {
                    name: displayName,
                    type: tableName,
                    isCore: false,
                    icon: isLookup ? 'Settings' : 'FileText',
                    path: `/dynamic/${tableName}`
                };
            })
            .filter(m => m !== null);

        res.json({
            core: CORE_MODULES,
            dynamic: dynamicModules
        });
    } catch (err) {
        console.error('Error fetching module list:', err);
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
};

exports.getModuleData = async (req, res) => {
    const { type } = req.params;
    const { filter } = req.query;

    try {
        // Security check
        const allowedTables = ['BiologicalAssets', 'InventoryStocks', 'StorageLocations', 'Chemicals'];
        if (!type.startsWith('ext_') && !allowedTables.includes(type)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (/[^a-zA-Z0-9_]/.test(type)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        // 1. Fetch MAIN Data
        let sql = `SELECT * FROM "${type}"`;
        if (filter && filter !== 'undefined' && filter !== 'null' && type === 'BiologicalAssets') {
            sql += ` WHERE "type" = '${filter}'`;
        }
        sql += ` ORDER BY id ASC`;
        
        const data = await db.sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT });

        if (data.length === 0) {
            return res.json({ type, count: 0, schema: [], data: [] });
        }

        // 2. Fetch LOOKUP Dictionaries (OPTIMIZED: 1 Query per Table)
        // Table-to-Column Mapping for relational fields
        const lookupRegistry = {
            'species_id': { table: 'bacterial_species', col: 'Species' },
            'Specie': { table: 'bacterial_species', col: 'Species' },
            'wild_type_id': { table: 'wild_type_recomb_types', col: 'Field1' },
            'Wild_type_Recom': { table: 'wild_type_recomb_types', col: 'Field1' },
            'stock_category_id': { table: 'stock_categories', col: 'Category' },
            'Stock_Category': { table: 'stock_categories', col: 'Category' },
            'phage_name_id': { table: 'phage_names', col: 'Bacteriophage_Name' },
            'Phage_Name': { table: 'phage_names', col: 'Bacteriophage_Name' },
            'lytic_type_id': { table: 'lytic_lysogenic_types', col: 'Type' },
            'Lytic_Lysogenic': { table: 'lytic_lysogenic_types', col: 'Type' },
            'plasmid_vector_id': { table: 'plasmid_vectors', col: 'Plasmid_Name' },
            'Vector_Name': { table: 'plasmid_vectors', col: 'Plasmid_Name' },
            'gene_source_id': { table: 'gene_sources', col: 'Donar_DNA_detail' },
            'Gene_Source': { table: 'gene_sources', col: 'Donar_DNA_detail' },
            'cloning_method_id': { table: 'cloning_methods', col: 'Cloninig_Method' },
            'Cloninig_Method': { table: 'cloning_methods', col: 'Cloninig_Method' },
            'antibiotic_marker_id': { table: 'antibiotics', col: 'Complete_Name' },
            'Antibiotic_Disc': { table: 'antibiotics', col: 'Complete_Name' }, // Relational link for Discs table
            'manufacturer_id': { table: 'manufacturers', col: 'Manufacturers' },
            'Manufacturer': { table: 'manufacturers', col: 'Manufacturers' },
            'freezer_id': { table: 'freezer_locations', col: 'Freezer' },
            'GS_Freezer_Number': { table: 'freezer_locations', col: 'Freezer' },
            'rack_id': { table: 'rack_locations', col: 'Rack_No' },
            'GS_Rack_Number': { table: 'rack_locations', col: 'Rack_No' },
            'box_id': { table: 'box_locations', col: 'Box_detail' },
            'GS_Box_details': { table: 'box_locations', col: 'Box_detail' },
            'against_species_id': { table: 'bacterial_species', col: 'Species' },
            'host_strain_id': { table: 'BiologicalAssets', col: 'strain_number' },
            // Phase 114: Added Relations for Primers, Projects, and Tasks
            'Binds_with_Phage_Bacteria_Plasmid': { table: 'primer_binding_organism_types', col: 'Field1' },
            'Phage': { table: 'BiologicalAssets', col: 'strain_number' },
            'Bacteria': { table: 'BiologicalAssets', col: 'strain_number' },
            'Plasmid': { table: 'BiologicalAssets', col: 'strain_number' },
            'lead_investigator_id': { table: 'Users', col: 'username' },
            'assigned_to_id': { table: 'Users', col: 'username' },
            'project_id': { table: 'ext_lab_projects', col: 'name' }
        };

        const dictionaries = {};
        const activeLookups = Object.keys(data[0]).filter(k => lookupRegistry[k]);
        
        const lookupPromises = activeLookups.map(async (key) => {
            const config = lookupRegistry[key];
            try {
                const results = await db.sequelize.query(`SELECT "ID" as id, "${config.col}" as label FROM "${config.table}"`, { type: Sequelize.QueryTypes.SELECT });
                const dict = {};
                results.forEach(r => dict[String(r.id)] = r.label);
                dictionaries[key] = dict;
            } catch (e) {
                console.error(`Dictionary load failed for ${config.table}:`, e.message);
                dictionaries[key] = {};
            }
        });

        await Promise.all(lookupPromises);

        // 3. Perform FAST Synchronous In-Memory Mapping
        const mappedData = data.map(row => {
            const newRow = { ...row };
            activeLookups.forEach(key => {
                const val = String(newRow[key]);
                if (newRow[key] && dictionaries[key][val]) {
                    newRow[key] = dictionaries[key][val];
                }
            });
            return newRow;
        });

        // 4. Dynamic Schema Generation
        const firstRow = mappedData[0];
        const schema = Object.keys(firstRow)
            .filter(k => !['createdAt', 'updatedAt', 'data', 'search_text', 'storage_location_id', 'source_id', 'id'].includes(k))
            .map(k => {
                let label = k.replace(/_/g, ' ');
                // cleanup typos/legacy
                if (label.toLowerCase() === 'specie') label = 'Species';
                if (label.toLowerCase() === 'quntity') label = 'Quantity'; // Fix MS Access typo
                if (label.toLowerCase() === 'wild type recom') label = 'Wild-Type/Recomb';
                label = label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                label = label.replace(/Id$/g, '').replace(/dna/i, 'DNA').replace(/gs/i, 'GS').trim();
                
                // Phase 114: Inject relational metadata
                const isRelational = !!lookupRegistry[k];
                const endpoint = isRelational ? `/lookup/${lookupRegistry[k].table.replace(/_/g, '-')}` : null;

                return { 
                    key: k, 
                    label, 
                    isRelational,
                    endpoint 
                };
            });
        
        schema.unshift({ key: 'id', label: 'ID' });

        res.json({ type, count: mappedData.length, schema, data: mappedData });

    } catch (err) {
        console.error('ModuleData Error:', err);
        res.status(500).send('Server Error');
    }
};

