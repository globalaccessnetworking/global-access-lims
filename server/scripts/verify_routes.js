const http = require('http');

const get = (path) => {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:5001${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', err => reject(err));
    });
};

(async () => {
    try {
        console.log("Checking / ...");
        const root = await get('/');
        console.log(`Root: ${root.status} - ${root.data}`);

        console.log("Checking /test-verification ...");
        const test = await get('/test-verification');
        console.log(`Test: ${test.status} - ${test.data}`);

        console.log("Checking /api/queries ...");
        const api = await get('/api/queries');
        console.log(`API: ${api.status} - Length: ${api.data.length}`);

    } catch (err) {
        console.error("Request failed:", err.message);
    }
})();
