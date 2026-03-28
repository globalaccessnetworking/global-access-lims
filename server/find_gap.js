const { sequelize, BiologicalAsset, StorageLocation } = require('./models');

async function check() {
    try {
        const baList = await BiologicalAsset.findAll({
            where: { type: 'Strain' },
            order: [['id', 'ASC']]
        });
        const [extList] = await sequelize.query('SELECT * FROM "ext_bacterial_strains" ORDER BY id ASC');

        let gapIndex = -1;
        for (let i = 0; i < Math.min(baList.length, extList.length); i++) {
            const ba = baList[i];
            const ext = extList[i];
            // If the relationship ba.id = ext.id + 9283 fails, we found a deviation
            if (ba.id !== ext.id + 9283) {
                console.log(`Gap detected at index ${i}: BA ID ${ba.id}, EXT ID ${ext.id}`);
                gapIndex = i;
                break;
            }
        }

        if (gapIndex !== -1) {
            console.log("Next few BA records:");
            console.log(baList.slice(gapIndex, gapIndex + 5).map(b => b.id));
            console.log("Next few EXT records:");
            console.log(extList.slice(gapIndex, gapIndex + 5).map(e => e.id));
        } else {
            console.log("No gap found in the first min(ba, ext) records using offset 9283.");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
