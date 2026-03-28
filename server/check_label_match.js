const { sequelize } = require('./models');

async function check() {
    try {
        const [results] = await sequelize.query(`
            SELECT ba.id, ba.strain_number, s."Strain_No"
            FROM "BiologicalAssets" ba
            JOIN "ext_bacterial_strains" s ON ba.strain_number = s."Strain_No"
            LIMIT 5
        `);
        console.log("MATCHES:", results);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
