const { sequelize } = require('./models');

async function check() {
    try {
        const [results] = await sequelize.query("SELECT * FROM \"BiologicalAsset\" LIMIT 1");
        if (results.length > 0) {
            console.log("COLUMNS:", Object.keys(results[0]));
        } else {
            console.log("EMPTY TABLE");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
