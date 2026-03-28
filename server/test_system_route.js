const axios = require('axios');

async function testApi() {
    const table = 'ext_lab_projects';
    try {
        console.log(`--- Testing API for table: ${table} ---`);
        const res = await axios.get(`http://localhost:5002/api/system/${table}`);
        console.log('Status:', res.status);
        if (res.data.schema) {
            console.log('Schema count:', res.data.schema.length);
            console.log('Schema keys:', res.data.schema.map(s => s.key));
            console.log('Debug info:', res.data.debug);
        } else {
            console.log('Response body:', res.data);
        }
    } catch (err) {
        console.error('API Error:', err.response ? err.response.data : err.message);
    }
}

testApi();
