const { sequelize, BiologicalAsset, StorageLocation, Chemical } = require('../models');

const verifyCounts = async () => {
    try {
        await sequelize.authenticate();
        const assetCount = await BiologicalAsset.count();
        const locationCount = await StorageLocation.count();
        const chemicalCount = await Chemical.count();

        console.log(`Verification Counts:`);
        console.log(`- BiologicalAssets (Strains): ${assetCount}`);
        console.log(`- StorageLocations: ${locationCount}`);
        console.log(`- Chemicals: ${chemicalCount}`);
    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await sequelize.close();
    }
};

verifyCounts();
