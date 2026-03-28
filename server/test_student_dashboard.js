const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5002/api';
const SECRET = process.env.JWT_SECRET || 'secret_key_placeholder';

async function test() {
    try {
        // 1. Get student user
        const { User } = require('./models');
        const user = await User.findOne({ where: { username: 'student' } });
        console.log('User found:', user.username, 'ID:', user.id);

        // 2. Mock token
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET);
        const headers = { Authorization: `Bearer ${token}` };

        // 3. Hit dashboard APIs
        console.log('\nFetching /dashboard/stats...');
        const stats = await axios.get(`${API_URL}/dashboard/stats`, { headers });
        console.log('Stats Metrics:', JSON.stringify(stats.data.metrics, null, 2));

        console.log('\nFetching /dashboard/user-tasks...');
        const tasks = await axios.get(`${API_URL}/dashboard/user-tasks`, { headers });
        console.log('User Tasks Found:', tasks.data.length);
        if (tasks.data.length > 0) {
            console.log('First Task Title:', tasks.data[0].title);
        }

        console.log('\nFetching /notifications...');
        const notifications = await axios.get(`${API_URL}/notifications`, { headers });
        console.log('Notifications (filtered):', JSON.stringify(notifications.data, null, 2));

        process.exit(0);
    } catch (err) {
        if (err.response) {
            console.error('Test failed with status:', err.response.status);
            console.error('Response data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Test failed with message:', err.message);
        }
        process.exit(1);
    }
}
test();
