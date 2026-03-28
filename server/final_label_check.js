const { sequelize, BiologicalAsset } = require('./models');

async function check() {
    try {
        const strains = await BiologicalAsset.findAll({
            where: { type: 'Strain' },
            limit: 5,
            order: [['id', 'ASC']]
        });
        console.log("HEALED STRAINS (First 5):");
        strains.forEach(s => console.log(` - ID ${s.id}: ${s.strain_number} (${s.species})`));

        const phages = await BiologicalAsset.findAll({
            where: { type: 'Phage' },
            limit: 5,
            order: [['id', 'ASC']]
        });
        console.log("HEALED PHAGES (First 5):");
        phages.forEach(p => console.log(` - ID ${p.id}: ${p.strain_number} (${p.species})`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
