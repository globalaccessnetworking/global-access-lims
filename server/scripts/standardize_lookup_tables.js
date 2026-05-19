const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('bacteriophage_lims', 'postgres', 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function standardize() {
    const renames = {
        "ext_bacterial_species": "bacterial_species",
        "ext_antibiotics": "antibiotics",
        "ext_manufacturers": "manufacturers",
        "ext_plasmid_vectors": "plasmid_vectors",
        "ext_stock_category": "stock_categories",
        "ext_cloninig_methods": "cloning_methods",
        "ext_gene_source": "gene_sources",
        "ext_lytic_lysogenic": "lytic_lysogenic_types",
        "ext_location_detail_freezer": "freezer_locations",
        "ext_location_detail_rack": "rack_locations",
        "ext_location_detail_box_name": "box_locations",
        "ext_bacteriophage_names": "phage_names",
        "ext_chemical_storage_area_details": "chemical_storage_areas",
        "ext_available_antibiotics_discs": "available_antibiotic_discs",
        "ext_wild_type_recomb": "wild_type_recomb_types",
        "ext_primer_binding_organism_type": "primer_binding_organism_types"
    };

    console.log("Renaming legacy tables to Clean Relational Schema...");
    for (const [oldName, newName] of Object.entries(renames)) {
        try {
            await sequelize.query(`ALTER TABLE "${oldName}" RENAME TO "${newName}";`);
            console.log(`[OK] ${oldName} -> ${newName}`);
        } catch (e) {
            console.log(`[SKIP] ${oldName} (Might not exist or already renamed)`);
        }
    }
    console.log("Standardization complete.");
    process.exit();
}
standardize();
