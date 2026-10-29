const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function inspect() {
    try {
        console.log('=== bacterial_species schema & sample ===');
        const desc = await sequelize.getQueryInterface().describeTable('bacterial_species');
        console.log('Columns:', Object.keys(desc));
        const species = await sequelize.query(`SELECT * FROM bacterial_species LIMIT 20`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Sample species rows:', species);

        console.log('\n=== ext_bacterial_strains Specie values ===');
        const Strains = await sequelize.query(`SELECT DISTINCT "Specie" FROM ext_bacterial_strains WHERE "Specie" IS NOT NULL LIMIT 20`, { type: Sequelize.QueryTypes.SELECT });
        console.log('Distinct Specie in strains:', Strains);
    } catch (e) {
        console.error(e);
    }
}

inspect();
