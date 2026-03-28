const { sequelize, BiologicalAsset } = require('./models');

async function check() {
    try {
        const baStrainEnd = await BiologicalAsset.findOne({ where: { type: 'Strain' }, order: [['id', 'DESC']] });
        const [extStrainEnd] = await sequelize.query('SELECT max(id) as max_id FROM "ext_bacterial_strains"');
        console.log('Strain End:', {
            ba: baStrainEnd.id,
            ext: extStrainEnd[0].max_id,
            offset: baStrainEnd.id - extStrainEnd[0].max_id
        });

        const baPhageEnd = await BiologicalAsset.findOne({ where: { type: 'Phage' }, order: [['id', 'DESC']] });
        const [extPhageEnd] = await sequelize.query('SELECT max(id) as max_id FROM "ext_bacteriophages"');
        console.log('Phage End:', {
            ba: baPhageEnd.id,
            ext: extPhageEnd[0].max_id,
            offset: baPhageEnd.id - extPhageEnd[0].max_id
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
