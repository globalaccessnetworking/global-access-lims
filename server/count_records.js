const { sequelize, BiologicalAsset } = require('./models');

async function check() {
    try {
        const [s] = await sequelize.query('SELECT count(*) as count FROM "ext_bacterial_strains"');
        const [p] = await sequelize.query('SELECT count(*) as count FROM "ext_bacteriophages"');
        const [pr] = await sequelize.query('SELECT count(*) as count FROM "ext_primers_details"');
        const central = await BiologicalAsset.count();

        console.log({
            ext_strains: parseInt(s[0].count),
            ext_phages: parseInt(p[0].count),
            ext_primers: parseInt(pr[0].count),
            ext_total: parseInt(s[0].count) + parseInt(p[0].count) + parseInt(pr[0].count),
            central_total: central
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
