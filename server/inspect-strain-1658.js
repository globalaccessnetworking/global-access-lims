const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function inspect() {
    try {
        console.log('=== Inspecting Strain DD-77 (or latest strains) ===');
        const rows = await sequelize.query(`SELECT * FROM ext_bacterial_strains ORDER BY id DESC LIMIT 5`, { type: Sequelize.QueryTypes.SELECT });
        console.log(rows);

        console.log('\n=== Inspecting bacterial_species for IDs ===');
        const species = await sequelize.query(`SELECT id, "ID", "Species" FROM bacterial_species ORDER BY id ASC`, { type: Sequelize.QueryTypes.SELECT });
        console.log(species);

        console.log('\n=== Inspecting rack_locations for IDs ===');
        const racks = await sequelize.query(`SELECT id, "ID", "Rack_No" FROM rack_locations ORDER BY id ASC LIMIT 15`, { type: Sequelize.QueryTypes.SELECT });
        console.log(racks);

    } catch (e) {
        console.error(e);
    }
}

inspect();
