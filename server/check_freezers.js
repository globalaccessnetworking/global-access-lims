const { StorageLocation } = require('./models');
const sequelize = require('./config/database');

async function checkFreezers() {
    try {
        await sequelize.authenticate();
        const distinctFreezers = await StorageLocation.aggregate('freezer_name', 'DISTINCT', { plain: false });
        console.log("DISTINCT FREEZERS:", distinctFreezers);

        const distinctRacks = await StorageLocation.aggregate('rack', 'DISTINCT', { plain: false });
        console.log("DISTINCT RACKS (first 5):", distinctRacks.slice(0, 5));

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkFreezers();
