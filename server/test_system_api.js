const axios = require('axios');

async function testApi() {
    try {
        const res = await axios.get('http://localhost:5000/api/system/ext_lab_projects');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}

testApi();
