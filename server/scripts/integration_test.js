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
        process.stdout.write(`SERVER: ${data}`);
        if (data.toString().includes('Server is running')) {
            console.log('Server detected as running. Waiting 2s before request...');
            setTimeout(makeRequest, 2000);
        }
    });

    server.stderr.on('data', (data) => {
        process.stderr.write(`SERVER ERROR: ${data}`);
    });

    server.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });

    async function makeRequest() {
        try {
            const secret = process.env.JWT_SECRET || 'secret_key_placeholder';
            const token = jwt.sign({ id: 1, role: 'Admin' }, secret, { expiresIn: '1h' });

            console.log('Making API Request...');
            const res = await axios.get(`http://localhost:${PORT}/api/inventory/stocks`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('--- API RESPONSE ---');
            console.log('Status:', res.status);
            console.log('Data Length:', res.data.length);
            if (res.data.length > 0) {
                console.log('Sample Item:', res.data[0]);
            }
            console.log('--- TEST PASSED ---');
        } catch (err) {
            console.error('API Request Failed:', err.message);
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', err.response.data);
            }
        } finally {
            console.log('Killing server...');
            server.kill();
            process.exit(0);
        }
    }

    // Fallback timeout
    setTimeout(() => {
        console.log('Timeout reached. Killing server.');
        server.kill();
        process.exit(1);
    }, 15000);
}

runTest();
