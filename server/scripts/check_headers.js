const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const file = path.join(__dirname, '../data_migration/Lab-Stock.csv');
const results = [];

fs.createReadStream(file)
    .pipe(csv())
    .on('data', (data) => {
        results.push(data);
        if (results.length === 1) {
            console.log('Headers:', Object.keys(data));
            console.log('Data:', data);
            process.exit(0);
        }
    });
