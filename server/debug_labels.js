const { BiologicalAsset } = require('./models');

async function check() {
    try {
        const assets = await BiologicalAsset.findAll({
            limit: 20,
            attributes: ['id', 'type', 'name', 'strain_number', 'species']
        });
        console.log("COLUMNS:", Object.keys(BiologicalAsset.rawAttributes));
        console.log("SAMPLES:", JSON.stringify(assets, null, 2));
        process.exit(0);
    } catch (e) {
        console.error("ERROR TYPE:", e.name);
        console.error("ERROR MESSAGE:", e.message);
        process.exit(1);
    }
}

check();
