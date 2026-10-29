const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function checkStrains() {
    try {
        console.log('=== Distinct GS_Rack_Number in ext_bacterial_strains ===');
        const gsRacks = await sequelize.query(`SELECT DISTINCT "GS_Rack_Number" FROM ext_bacterial_strains WHERE "GS_Rack_Number" IS NOT NULL AND "GS_Rack_Number" != ''`, { type: Sequelize.QueryTypes.SELECT });
        console.log(gsRacks.map(r => r.GS_Rack_Number));

        console.log('\n=== Distinct GD_Rack_Number in ext_bacterial_strains ===');
        const gdRacks = await sequelize.query(`SELECT DISTINCT "GD_Rack_Number" FROM ext_bacterial_strains WHERE "GD_Rack_Number" IS NOT NULL AND "GD_Rack_Number" != ''`, { type: Sequelize.QueryTypes.SELECT });
        console.log(gdRacks.map(r => r.GD_Rack_Number));

        console.log('\n=== Distinct GS_Box_details in ext_bacterial_strains ===');
        const gsBoxes = await sequelize.query(`SELECT DISTINCT "GS_Box_details" FROM ext_bacterial_strains WHERE "GS_Box_details" IS NOT NULL AND "GS_Box_details" != ''`, { type: Sequelize.QueryTypes.SELECT });
        console.log(gsBoxes.map(b => b.GS_Box_details));

        console.log('\n=== Distinct GD_Box_detail in ext_bacterial_strains ===');
        const gdBoxes = await sequelize.query(`SELECT DISTINCT "GD_Box_detail" FROM ext_bacterial_strains WHERE "GD_Box_detail" IS NOT NULL AND "GD_Box_detail" != ''`, { type: Sequelize.QueryTypes.SELECT });
        console.log(gdBoxes.map(b => b.GD_Box_detail));

        console.log('\n=== Distinct Specie in ext_bacterial_strains ===');
        const species = await sequelize.query(`SELECT DISTINCT "Specie" FROM ext_bacterial_strains WHERE "Specie" IS NOT NULL AND "Specie" != ''`, { type: Sequelize.QueryTypes.SELECT });
        console.log(species.map(s => s.Specie));
    } catch (e) {
        console.error(e);
    }
}

checkStrains();
