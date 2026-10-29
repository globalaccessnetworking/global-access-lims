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

async function testUpdate() {
    try {
        console.log('=== Step 1: Checking row 457 before update ===');
        const [before] = await sequelize.query(`SELECT "id", "Activity_Shown_Against", "Glycerol_Stock_Rack", "Glycerol_Stock_Box" FROM ext_plasmids WHERE id = 457`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Before update:', before);

        console.log('\n=== Step 2: Updating row 457 to new values ===');
        // 11 = Avian pathogenic Escherichia coli(APEC) in bacterial_species
        // 22 = F-2 in rack_locations
        // 101 = Primer Box-A4 in box_locations
        await sequelize.query(
            `UPDATE ext_plasmids SET "Activity_Shown_Against" = '11', "Glycerol_Stock_Rack" = '22', "Glycerol_Stock_Box" = '101' WHERE id = 457`,
            { type: Sequelize.QueryTypes.UPDATE }
        );
        console.log('Update SQL executed successfully.');

        console.log('\n=== Step 3: Checking row 457 after update ===');
        const [after] = await sequelize.query(`SELECT "id", "Activity_Shown_Against", "Glycerol_Stock_Rack", "Glycerol_Stock_Box" FROM ext_plasmids WHERE id = 457`, { type: Sequelize.QueryTypes.SELECT });
        console.log('After update:', after);

        // Fetch translations for species 11, rack 22, box 101
        const [sp] = await sequelize.query(`SELECT "Species" FROM bacterial_species WHERE id = 11`, { type: Sequelize.QueryTypes.SELECT });
        const [rk] = await sequelize.query(`SELECT "Rack_No" FROM rack_locations WHERE id = 22`, { type: Sequelize.QueryTypes.SELECT });
        const [bx] = await sequelize.query(`SELECT "Box_detail" FROM box_locations WHERE id = 101`, { type: Sequelize.QueryTypes.SELECT });

        console.log('\n=== Step 4: Verification of translated labels ===');
        console.log(`Activity_Shown_Against = "${after.Activity_Shown_Against}" → "${sp?.Species}"`);
        console.log(`Glycerol_Stock_Rack    = "${after.Glycerol_Stock_Rack}" → "${rk?.Rack_No}"`);
        console.log(`Glycerol_Stock_Box     = "${after.Glycerol_Stock_Box}" → "${bx?.Box_detail}"`);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

testUpdate();
