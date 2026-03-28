const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

async function testEndpoint() {
    try {
        const secret = process.env.JWT_SECRET || 'secret_key_placeholder';
        const token = jwt.sign(
            { id: 1, role: 'Admin', username: 'admin' },
            secret,
            { expiresIn: '1h' }
        );

        console.log('Generated Token:', token);
        console.log('Testing URL: http://localhost:5000/api/inventory/stocks');

        const res = await axios.get('http://localhost:5000/api/inventory/stocks', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Status:', res.status);
        console.log('Data Type:', Array.isArray(res.data) ? 'Array' : typeof res.data);
        console.log('Record Count:', Array.isArray(res.data) ? res.data.length : 'N/A');

        if (Array.isArray(res.data) && res.data.length > 0) {
            console.log('First Item:', JSON.stringify(res.data[0], null, 2));
        }

    } catch (err) {
        console.error('Request Failed:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', err.response.data);
        }
    }
}

testEndpoint();
