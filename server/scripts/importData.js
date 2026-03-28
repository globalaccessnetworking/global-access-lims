const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize, User, BiologicalAsset, StorageLocation, Chemical } = require('../models');

const DATA_DIR = path.join(__dirname, '../data_migration');

const importData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        await sequelize.sync({ force: true }); // Reset DB
        console.log('Database synced (All data cleared).');

        // Helper to Create/Find Storage
        const getStorageId = async (freezer, rack, box, position) => {
            if (!freezer) return null;
            const [loc] = await StorageLocation.findOrCreate({
                where: {
                    freezer_name: String(freezer).trim(),
                    rack: String(rack).trim(),
                    box: String(box).trim(),
                    position: String(position).trim()
                }
            });
            return loc.id;
        };

        const processFile = (filename, onRow) => {
            return new Promise((resolve, reject) => {
                const results = [];
                const filePath = path.join(DATA_DIR, filename);
                if (!fs.existsSync(filePath)) {
                    console.warn(`File not found: ${filename}`);
                    resolve();
                    return;
                }

                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', async () => {
                        console.log(`Processing ${filename}: ${results.length} rows...`);
                        let count = 0;
                        for (const row of results) {
                            try {
                                await onRow(row);
                                count++;
                            } catch (err) {
                                console.error(`Error in ${filename} row:`, err.message);
                            }
                        }
                        console.log(`Finished ${filename}: Imported ${count} records.`);
                        resolve();
                    })
                    .on('error', reject);
            });
        };

        // 1. Bacterial Strains
        await processFile('Bacterial Strains.csv', async (row) => {
            if (!row['Strain No']) return;

            // Check formatted strain number to avoid duplicates if CSV has them
            const existing = await BiologicalAsset.findOne({ where: { strain_number: row['Strain No'] } });
            if (existing) return;

            const storageId = await getStorageId(
                row['GS-Freezer Number'],
                row['GS-Rack Number'],
                row['GS-Box-details'],
                row['Location in Box-GS']
            );

            await BiologicalAsset.create({
                type: 'Strain',
                species: row['Specie'] || 'Unknown Bacteria',
                strain_number: row['Strain No'],
                characteristics: row['Detail of Bacterial Strain'] || row['Antibiotic resistance'],
                source: 'Lab Stock',
                storage_location_id: storageId
            });
        });

        // 2. Bacteriophages
        await processFile('Bacteriophages.csv', async (row) => {
            if (!row['Bacteriophage Name']) return;

            const existing = await BiologicalAsset.findOne({ where: { strain_number: row['Bacteriophage Name'] } });
            if (existing) return;

            const storageId = await getStorageId(
                row['GS-Freezer Name'],
                row['GS-Racks'],
                row['GS-Box details'],
                row['GS-position in Box']
            );

            await BiologicalAsset.create({
                type: 'Phage',
                species: row['Bacteriophage Name'], // Using Name as Species for Phages often
                strain_number: row['Bacteriophage Name'], // ID is Name
                characteristics: `Host: ${row['Host Bacteria']}. ${row['Characterization details'] || ''}`,
                source: 'Lab Stock',
                storage_location_id: storageId
            });
        });

        // 3. Plasmids
        await processFile('Plasmids.csv', async (row) => {
            if (!row['Plasmid Name']) return;

            // Use ID if available, else Name
            const id = row['ID'] || row['Plasmid Name'];

            const existing = await BiologicalAsset.findOne({ where: { strain_number: id } });
            if (existing) return;

            const storageId = await getStorageId(
                row['GLycerol Stock Freezer'],
                row['Glycerol Stock Rack'],
                row['Glycerol Stock Box'],
                row['Location in Box-GS']
            );

            await BiologicalAsset.create({
                type: 'Plasmid',
                species: row['Plasmid Name'],
                strain_number: id,
                characteristics: `Backbone: ${row['Plasmid Backbone']}. Marker: ${row['Antibiotic Marker']}`,
                source: row['Gene Source'],
                storage_location_id: storageId
            });
        });

        // 4. Primers
        await processFile('Primers-details.csv', async (row) => {
            if (!row['Primer Name']) return;

            // Use ID if available, else Name. Primers often share names, so be careful.
            // Let's use ID from CSV as strain_number to be unique
            const id = row['ID'] ? `PRIMER-${row['ID']}` : row['Primer Name'];

            const existing = await BiologicalAsset.findOne({ where: { strain_number: id } });
            if (existing) return;

            const storageId = await getStorageId(
                row['Freezer'],
                row['Freezer Shelve'], // Mapping Shelve to Rack for simplicity? Or create new field? Let's use Rack.
                row['Box detail'],
                row['Location in Box']
            );

            await BiologicalAsset.create({
                type: 'Primer',
                species: row['Primer Name'],
                strain_number: id,
                characteristics: `Sequence: ${row['DNA sequence']}. Purpose: ${row['Purpose']}`,
                source: 'Lab Stock',
                storage_location_id: storageId
            });
        });

        // 5. Antibiotics (Chemicals)
        await processFile('Antibiotics.csv', async (row) => {
            if (!row['Complete Name']) return;

            // Clean quantity string (e.g., "500 mg" -> 500)
            let qty = 0;
            let unit = 'mg';
            if (row['Quantity']) {
                const match = row['Quantity'].match(/(\d+(\.\d+)?)\s*([a-zA-Z]+)/);
                if (match) {
                    qty = parseFloat(match[1]);
                    unit = match[3];
                } else {
                    qty = parseFloat(row['Quantity']) || 0;
                }
            }

            await Chemical.create({
                name: row['Complete Name'],
                barcode: row['Abbreviation'] || `CHEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                current_volume: qty,
                unit: unit,
                threshold_limit: 10 // Default threshold
            });
        });

        console.log('Migration Completed Successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

importData();
