const { sequelize, BiologicalAsset, StorageLocation } = require('./models');

async function check() {
    try {
        const baList = await BiologicalAsset.findAll({
            where: { type: 'Strain' },
            order: [['id', 'ASC']],
            limit: 10
        });
        const [extList] = await sequelize.query('SELECT * FROM "ext_bacterial_strains" ORDER BY id ASC LIMIT 10');

        const comparisons = baList.map((ba, i) => {
            const ext = extList[i];
            return {
                ba: { id: ba.id, sn: ba.strain_number },
                ext: { id: ext.id, sn: ext.Strain_No }
            };
        });

        console.log("STRAINS COMPARISON (First 10):", JSON.stringify(comparisons, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
