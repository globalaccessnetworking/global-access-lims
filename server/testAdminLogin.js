const axios = require('axios');

const testLogin = async () => {
    const url = 'http://localhost:5000/api/auth/login';
    const payload = {
        username: 'admin',
        password: 'admin123'
    };

    console.log(`Sending POST request to ${url}...`);
    console.log('Payload:', payload);

    try {
        const response = await axios.post(url, payload);
        console.log('✅ LOGIN SUCCESS!');
        console.log('Status:', response.status);
        console.log('Token:', response.data.token ? 'Yes (Received)' : 'No (Missing)');
        console.log('User:', response.data.user);
    } catch (error) {
        console.error('❌ LOGIN FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received (Server might be down or CORS issue)');
        } else {
            console.error('Error:', error.message);
        }
    }
};

testLogin();
