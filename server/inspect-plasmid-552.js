const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function inspect() {
    try {
        console.log('=== Plasmid row 552 raw DB values ===');
        const rows = await sequelize.query(`SELECT * FROM ext_plasmids WHERE id = 552`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Row 552:', rows[0]);

        console.log('\n=== Racks lookup sample ===');
        const racks = await sequelize.query(`SELECT id, "ID", "Rack_No" FROM rack_locations WHERE "Rack_No" ILIKE '%F-2%' OR "Rack_No" ILIKE '%w%' LIMIT 20`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Racks matching F-2 or w:', racks);

        console.log('\n=== Boxes lookup sample ===');
        const boxes = await sequelize.query(`SELECT id, "ID", "Box_detail" FROM box_locations WHERE "Box_detail" ILIKE '%Primer Box-A4%' OR "Box_detail" ILIKE '%GS-110%' LIMIT 20`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Boxes matching Primer Box-A4 or GS-110:', boxes);

        console.log('\n=== Host bacteria sample ===');
        const hosts = await sequelize.query(`SELECT id, "ID", "Host_Bacteria_No" FROM ext_host_bacteria LIMIT 10`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Host bacteria:', hosts);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

inspect();
