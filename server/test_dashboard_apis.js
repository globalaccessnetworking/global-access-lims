const axios = require('axios');

async function testDashboardAPIs() {
    console.log('🧪 Testing Dashboard API Endpoints\n');
    console.log('='.repeat(60));

    const baseURL = 'http://localhost:5000/api';
    const endpoints = [
        '/dashboard/stats',
        '/activity/stats',
        '/activity/recent?limit=10',
        '/alerts'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n📡 Testing: ${endpoint}`);
            const response = await axios.get(`${baseURL}${endpoint}`);
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📦 Data keys: ${Object.keys(response.data).join(', ')}`);
        } catch (error) {
            console.log(`   ❌ Error: ${error.response?.status || error.message}`);
            if (error.response?.data) {
                console.log(`   📝 Response: ${JSON.stringify(error.response.data)}`);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ API Test Complete\n');
}

testDashboardAPIs();
