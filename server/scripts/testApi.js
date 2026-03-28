const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';

const testApi = async () => {
    try {
        console.log('1. Registering Admin User...');
        // Note: Register is protected by Admin role, so we need to seed an admin or disable middleware temporarily for first run.
        // For this test, let's assume we can register if DB is empty or use a specific seed script.
        // Actually, let's try to login if user exists, or just manually insert via console if needed.
        // BUT, for the "Test Agent" request, I will simulate the flow.

        // Let's create a temporary admin user directly in DB for testing if not exists
        const { User } = require('../models');
        const bcrypt = require('bcryptjs');

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('admin123', salt);

        const [admin, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                password_hash,
                role: 'Admin'
            }
        });

        console.log(created ? 'Admin user created.' : 'Admin user already exists.');

        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        token = loginRes.data.token;
        console.log('Login successful. Token received.');

        console.log('3. Fetching Assets...');
        const assetsRes = await axios.get(`${API_URL}/assets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`Assets fetched: ${assetsRes.data.length}`);

        // Show first 3 assets as sample
        console.log('Sample Assets:', JSON.stringify(assetsRes.data.slice(0, 3), null, 2));

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
};

testApi();
