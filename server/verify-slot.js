const { sequelize } = require('./models');
async function verify() {
    // Check slot C2 in box 32 (GS-26 C1-b)
    const slot = await sequelize.query(
        `SELECT box_name, position_code, asset_label, asset_id, source_table, is_occupied FROM box_position_index WHERE box_name = '32' AND position_code = 'C2'`,
        { type: 'SELECT' }
    );
    console.log('Slot C2 in box 32 (GS-26 C1-b):', JSON.stringify(slot, null, 2));
    process.exit(0);
}
verify().catch(e => { console.error(e.message); process.exit(1); });
