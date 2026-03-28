const { BiologicalAsset } = require('./models');

async function check() {
    try {
        const assets = await BiologicalAsset.findAll({
            limit: 10,
            attributes: ['id', 'name', 'designation', 'strain_number', 'species', 'type']
        });
        console.log(JSON.stringify(assets, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
