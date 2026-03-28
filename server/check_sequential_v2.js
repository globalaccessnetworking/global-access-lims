const { sequelize, BiologicalAsset, StorageLocation } = require('./models');

async function check() {
    try {
        const baList = await BiologicalAsset.findAll({
            where: { type: 'Phage' },
            order: [['id', 'ASC']],
            include: [StorageLocation],
            limit: 10
        });
        const [extList] = await sequelize.query('SELECT * FROM "ext_bacteriophages" ORDER BY id ASC LIMIT 10');

        const comparisons = baList.map((ba, i) => {
            const ext = extList[i];
            return {
                match: (ba.StorageLocation && ba.StorageLocation.position === ext.GS_position_in_Box),
                ba: { id: ba.id, pos: ba.StorageLocation?.position },
                ext: { id: ext.id, pos: ext.GS_position_in_Box, name: ext.Bacteriophage_Name }
            };
        });

        console.log("COMPARISON (First 10):", JSON.stringify(comparisons, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
