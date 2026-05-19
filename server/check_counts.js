const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('bacteriophage_lims', 'postgres', 'phagelabdrshafiq', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

async function checkCounts() {
    try {
        const tablesRaw = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public'
        `, { type: Sequelize.QueryTypes.SELECT });

        for (const t of tablesRaw) {
            const count = await sequelize.query(`SELECT COUNT(*) as c FROM "${t.table_name}"`, { type: Sequelize.QueryTypes.SELECT });
            console.log(`${t.table_name}: ${count[0].c}`);
        }
    } catch (e) {
        console.error(e);
    }
}
checkCounts();
