const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ user: { id: 1, role: 'Admin' } }, 'secret_key_placeholder', { expiresIn: '1h' });

async function test() {
    try {
        const res = await axios.get('http://localhost:5002/api/lookup/species', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(res.data);
    } catch (e) {
        console.log(e.message);
    }
}
test();
