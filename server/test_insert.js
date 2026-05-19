const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ user: { id: 1, role: 'Admin' } }, 'secret_key_placeholder', { expiresIn: '1h' });

async function testInsert() {
    try {
        const payload = {
            type: 'Strain',
            species: 'Pseudomonas aeroginosa',
            species_id: 2, 
            wild_type_id: 1, 
            strain_number: 'TEST-999',
            characteristics: 'Test insertion with IDs',
            StorageLocation: {
                freezer_id: 1,
                freezer_name: '-80 Freezer',
                rack_id: 2,
                rack: 'A-2',
                box_id: 3,
                box: 'GS-2 (A1-b)',
                position: 'A1'
            }
        };

        const res = await axios.post('http://localhost:5002/api/assets', payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("✅ Success! ID:", res.data.id);
        
        const { BiologicalAsset, StorageLocation } = require('./models');
        const asset = await BiologicalAsset.findByPk(res.data.id, { include: [StorageLocation] });
        
        console.log("\nSaved Asset:");
        console.log(` - Species ID: ${asset.species_id}`);
        if(asset.StorageLocation) {
            console.log(` - Freezer ID: ${asset.StorageLocation.freezer_id}`);
        }
        
    } catch (err) {
        if(err.response) {
            console.error('❌ API Error:', err.response.data);
        } else {
            console.error('❌ Insert Error:', err.message);
        }
    } finally {
        process.exit();
    }
}

testInsert();
