const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function inspect() {
    try {
        console.log('=== Strain id=222 ===');
        const s222 = await sequelize.query(`SELECT * FROM ext_bacterial_strains WHERE id = 222`, { type: Sequelize.QueryTypes.SELECT });
        console.log(s222[0]);

        console.log('\n=== Strain id=1655 ===');
        const s1655 = await sequelize.query(`SELECT * FROM ext_bacterial_strains WHERE id = 1655`, { type: Sequelize.QueryTypes.SELECT });
        console.log(s1655[0]);

        console.log('\n=== Latest 5 Strains ===');
        const latest = await sequelize.query(`SELECT id, "Strain_No", "Specie", "GS_Rack_Number", "GD_Rack_Number", "GS_Box_details", "GD_Box_detail" FROM ext_bacterial_strains ORDER BY id DESC LIMIT 5`, { type: Sequelize.QueryTypes.SELECT });
        console.log(latest);
    } catch (e) {
        console.error(e);
    }
}

inspect();
