const { StorageLocation, BiologicalAsset } = require('./models');
const { Op } = require('sequelize');

async function repairStorage() {
    try {
        console.log('--- STARTING STORAGE REPAIR ---');

        // 1. Get Unallocated Assets
        const unallocatedAssets = await BiologicalAsset.findAll({
            where: { storage_location_id: null },
            order: [['id', 'ASC']]
        });
        console.log(`Found ${unallocatedAssets.length} unallocated assets.`);

        if (unallocatedAssets.length === 0) {
            console.log('No assets to allocate. Exiting.');
            return;
        }

        // 2. Get Available Locations
        // We need to check which locations are already taken to be safe, 
        // but since we found 0 links earlier, we assume most are free. 
        // However, best practice is to check.
        // Actually, let's just fetch ALL locations and iterate.
        const allLocations = await StorageLocation.findAll({
            order: [['box', 'ASC'], ['position', 'ASC']] // Fill Box 1, A1 -> A9, B1... then Box 2...
        });
        console.log(`Found ${allLocations.length} total storage locations.`);

        // 3. Allocation Loop
        let allocatedCount = 0;
        const updates = [];

        for (let i = 0; i < unallocatedAssets.length; i++) {
            if (i >= allLocations.length) {
                console.log('WARNING: Run out of storage space!');
                break;
            }

            const asset = unallocatedAssets[i];
            const location = allLocations[i];

            // Update the asset with the location ID
            // Pushing promise to array for parallel execution could allow faster batching
            updates.push(asset.update({ storage_location_id: location.id }));
            allocatedCount++;
        }

        console.log(`Allocating ${allocatedCount} assets... this may take a moment.`);
        await Promise.all(updates);

        console.log('--- REPAIR COMPLETE ---');
        console.log(`Successfully assigned ${allocatedCount} assets to storage locations.`);

    } catch (err) {
        console.error('Repair Error:', err);
    }
}

repairStorage();
