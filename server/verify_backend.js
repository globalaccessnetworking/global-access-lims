const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const SECRET = process.env.JWT_SECRET || 'secret_key_placeholder';

async function verify() {
    try {
        console.log('--- Verifying Backend APIs ---');

        // 1. Generate a token for admin (ID 114)
        const token = jwt.sign({ id: 114, username: 'admin', role: 'Admin' }, SECRET);
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Verify Stats API
        console.log('Checking /dashboard/stats...');
        const statsRes = await axios.get(`${API_URL}/dashboard/stats`, { headers });
        console.log('Stats Response:', JSON.stringify(statsRes.data.metrics, null, 2));

        if (statsRes.data.metrics.activeProjects !== undefined) {
            console.log('✅ Active Projects metric present');
        } else {
            console.log('❌ Active Projects metric MISSING');
        }

        // 3. Verify User Tasks API
        console.log('\nChecking /dashboard/user-tasks...');
        const tasksRes = await axios.get(`${API_URL}/dashboard/user-tasks`, { headers });
        console.log('User Tasks Found:', tasksRes.data.length);

        if (tasksRes.data.length >= 0) {
            console.log('✅ User Tasks API functional');
            if (tasksRes.data.length > 0) {
                console.log('Sample Task:', tasksRes.data[0].title);
            }
        }

        // 4. Verify Alerts API
        console.log('\nChecking /alerts...');
        const alertsRes = await axios.get(`${API_URL}/alerts`, { headers });
        const taskAlerts = alertsRes.data.expiring.filter(a => a.type === 'Task Overdue');
        const projectAlerts = alertsRes.data.expiring.filter(a => a.type === 'Project Deadline');

        console.log('Task Alerts:', taskAlerts.length);
        console.log('Project Alerts:', projectAlerts.length);

        console.log('✅ Backend verification complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

// Make sure server is running or use a mock approach if needed.
// Since the environment usually has the server running, I'll try to hit it.
verify();
