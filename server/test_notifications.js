const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const SECRET = process.env.JWT_SECRET || 'secret_key_placeholder';

async function test() {
    try {
        // 1. Get admin token
        const token = jwt.sign({ id: 114, username: 'admin', role: 'SuperAdmin' }, SECRET);
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create a task for student (ID 116)
        console.log('Creating task for student...');
        const taskRes = await axios.post(`${API_URL}/system/ext_lab_tasks`, {
            title: 'Test Notification Task',
            description: 'Checking if notification triggers',
            status: 'Pending',
            assigned_to_id: 116
        }, { headers });

        console.log('Task created:', taskRes.data.record.id);

        // 3. Verify notification in DB
        const { Notification } = require('./models');
        const latest = await Notification.findOne({
            where: { user_id: 116 },
            order: [['created_at', 'DESC']]
        });

        if (latest && latest.message.includes('Test Notification Task')) {
            console.log('✅ Notification successfully created in DB!');
            console.log('Message:', latest.message);
        } else {
            console.log('❌ Notification NOT found');
        }

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err.response?.data || err.message);
        process.exit(1);
    }
}
test();
