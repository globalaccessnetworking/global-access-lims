const { spawn } = require('child_process');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = 5000;

async function runTest() {
    console.log('Starting server...');
    const server = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '../'),
        stdio: 'pipe',
        env: { ...process.env, PORT }
    });

    server.stdout.on('data', (data) => {
        if (data.toString().includes('Server is running')) {
            console.log('Server running. Waiting 2s...');
            setTimeout(makeRequest, 2000);
        }
    });

    server.stderr.on('data', (d) => process.stderr.write(d));

    async function makeRequest() {
        try {
            const secret = process.env.JWT_SECRET || 'secret_key_placeholder';
            const token = jwt.sign({ id: 1, role: 'Admin' }, secret, { expiresIn: '1h' });

            console.log('1. Testing /api/modules/list ...');
            const resList = await axios.get(`http://localhost:${PORT}/api/modules/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Modules Found:', resList.data.dynamic.length);
            console.log('Sample Dynamic Module:', resList.data.dynamic[0]);

            if (resList.data.dynamic.length > 0) {
                const targetType = resList.data.dynamic[0].type; // e.g. "Manufacturers.csv"
                console.log(`2. Testing /api/modules/${targetType} ...`);
                const resData = await axios.get(`http://localhost:${PORT}/api/modules/${targetType}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`Data Count for ${targetType}:`, resData.data.count);
                console.log('Schema:', resData.data.schema.map(s => s.key).join(', '));
            }

            console.log('--- TEST PASSED ---');
        } catch (err) {
            console.error('Test Failed:', err.message);
            if (err.response) {
                console.error('Data:', err.response.data);
            }
        } finally {
            server.kill();
            process.exit(0);
        }
    }

    setTimeout(() => {
        server.kill();
        process.exit(0);
    }, 10000);
}

runTest();
