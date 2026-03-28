const { sequelize, BiologicalAsset } = require('../models');

async function heal() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Heal Strains (Offset 9283)
        const [extStrains] = await sequelize.query('SELECT id, "Strain_No", "Specie" FROM "ext_bacterial_strains" ORDER BY id ASC');
        console.log(`Processing ${extStrains.length} external strains...`);

        let strainCount = 0;
        let strainFails = 0;
        for (const ext of extStrains) {
            const baId = ext.id + 9283;
            let newName = (ext.Strain_No || `Strain-${ext.id}`).trim();
            const newSpecie = ext.Specie || 'Unknown';

            try {
                const [affected] = await BiologicalAsset.update(
                    { strain_number: newName, species: newSpecie },
                    { where: { id: baId, type: 'Strain' } }
                );
                if (affected > 0) strainCount++;
            } catch (err) {
                if (err.name === 'SequelizeUniqueConstraintError') {
                    // Fallback: Append ID to make it unique
                    newName = `${newName} (${baId})`;
                    await BiologicalAsset.update(
                        { strain_number: newName, species: newSpecie },
                        { where: { id: baId, type: 'Strain' } }
                    );
                    strainCount++;
                } else {
                    console.error(`Failed strain ${baId}:`, err.message);
                    strainFails++;
                }
            }
        }
        console.log(`Healed ${strainCount} strains (${strainFails} failed).`);

        // 2. Heal Phages (Offset 10495)
        const [extPhages] = await sequelize.query('SELECT id, "Bacteriophage_Name", "Host_Bacteria" FROM "ext_bacteriophages" ORDER BY id ASC');
        console.log(`Processing ${extPhages.length} external phages...`);

        let phageCount = 0;
        let phageFails = 0;
        for (const ext of extPhages) {
            const baId = ext.id + 10495;
            let newName = (ext.Bacteriophage_Name || `Phage-${ext.id}`).trim();
            const newSpecie = ext.Host_Bacteria || 'Unknown';

            try {
                const [affected] = await BiologicalAsset.update(
                    { strain_number: newName, species: newSpecie },
                    { where: { id: baId, type: 'Phage' } }
                );
                if (affected > 0) phageCount++;
            } catch (err) {
                if (err.name === 'SequelizeUniqueConstraintError') {
                    newName = `${newName} (${baId})`;
                    await BiologicalAsset.update(
                        { strain_number: newName, species: newSpecie },
                        { where: { id: baId, type: 'Phage' } }
                    );
                    phageCount++;
                } else {
                    console.error(`Failed phage ${baId}:`, err.message);
                    phageFails++;
                }
            }
        }
        console.log(`Healed ${phageCount} phages (${phageFails} failed).`);

        console.log('\nData healing complete.');
        process.exit(0);
    } catch (err) {
        console.error('Healing failed:', err);
        process.exit(1);
    }
}

heal();
