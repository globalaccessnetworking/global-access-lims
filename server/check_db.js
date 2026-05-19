const { BiologicalAsset, StorageLocation } = require('./models');

async function checkLast() {
    try {
        const last = await BiologicalAsset.findOne({
            order: [['id', 'DESC']],
            include: [StorageLocation]
        });
        console.log("Last Asset DB entry:");
        console.log(last.toJSON());
    } finally {
        process.exit();
    }
}

checkLast();
