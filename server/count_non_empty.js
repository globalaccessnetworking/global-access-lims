const { sequelize } = require('./models');

async function check() {
    try {
        const [s] = await sequelize.query('SELECT count(*) as count FROM "ext_bacterial_strains" WHERE "Strain_No" IS NOT NULL AND "Strain_No" != \'\'');
        const [p] = await sequelize.query('SELECT count(*) as count FROM "ext_bacteriophages" WHERE "Bacteriophage_Name" IS NOT NULL AND "Bacteriophage_Name" != \'\'');
        console.log({
            non_empty_strains: parseInt(s[0].count),
            non_empty_phages: parseInt(p[0].count)
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
