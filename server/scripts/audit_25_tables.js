const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('bacteriophage_lims', 'postgres', 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function runAudit() {
    console.log("---------------------------------------------------------");
    console.log("PHASE 114.1: 25-TABLE DEEP AUDIT (RELATIONAL SCHEMA)");
    console.log("---------------------------------------------------------");

    const targets = [
        "BiologicalAssets",
        "InventoryStocks",
        "StorageLocations",
        "Chemicals",
        "Users",
        "AuditLogs",
        "AvailableAntibiotics",
        "PhageHostInteractions",
        "Experiments",
        "Notifications",
        "SavedQueries",
        "GenericRecords",
        "bacterial_species",
        "antibiotics",
        "manufacturers",
        "plasmid_vectors",
        "stock_categories",
        "freezer_locations",
        "rack_locations",
        "box_locations",
        "cloning_methods",
        "gene_sources",
        "lytic_lysogenic_types",
        "phage_names",
        "chemical_storage_areas",
        "available_antibiotic_discs",
        "wild_type_recomb_types"
    ];

    for (const table of targets) {
        try {
            const countRes = await sequelize.query(`SELECT COUNT(*) as c FROM "${table}"`, { type: Sequelize.QueryTypes.SELECT });
            console.log(`${table.padEnd(25)}: ${countRes[0].c} rows`);
        } catch (e) {
            console.log(`${table.padEnd(25)}: MISSING [CRITICAL]`);
        }
    }
    console.log("---------------------------------------------------------");
    process.exit();
}

runAudit();
