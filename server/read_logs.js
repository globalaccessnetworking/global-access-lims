const fs = require('fs');
const path = require('path');
const os = require('os');

const logPath = path.join(os.homedir(), '.pm2_fresh', 'logs', 'lims-backend-error.log');

try {
    const data = fs.readFileSync(logPath, 'utf8');
    const lines = data.split('\n');
    console.log(lines.slice(-50).join('\n'));
} catch (e) {
    console.error("Error reading log:", e.message);
}
