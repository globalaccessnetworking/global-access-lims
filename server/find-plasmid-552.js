const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function findPlasmid() {
    try {
        console.log('=== Searching for Plasmid with ID or id 552 ===');
        const byId = await sequelize.query(`SELECT id, "ID", "Plasmid_Name" FROM ext_plasmids WHERE id = 552`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Match by id = 552:', byId);

        const byLegacyID = await sequelize.query(`SELECT id, "ID", "Plasmid_Name" FROM ext_plasmids WHERE "ID" = '552'`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Match by "ID" = "552":', byLegacyID);

        const byNameTest = await sequelize.query(`SELECT id, "ID", "Plasmid_Name", "Glycerol_Stock_Tube_Label" FROM ext_plasmids WHERE "Plasmid_Name" ILIKE '%test%' OR "Glycerol_Stock_Tube_Label" ILIKE '%testlabel%'`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Match by name/label test:', byNameTest);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

findPlasmid();
