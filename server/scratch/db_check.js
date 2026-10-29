const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:phagelabdrshafiq@localhost:5432/bacteriophage_lims', { logging: false });

async function check() {
    try {
        const [res] = await sequelize.query(`SELECT "ID", "Box_detail" FROM box_locations;`);
        const testBoxes = res.filter(r => String(r.Box_detail).toUpperCase().includes('TEST'));
        console.table(testBoxes);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
