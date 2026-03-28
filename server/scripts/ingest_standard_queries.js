const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables explicitly from root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 2. Load Database & Model
const sequelize = require('../config/database');
const SavedQuery = require('../models/SavedQuery');

const QUERIES_DIR = path.join(__dirname, '../data_queries');

// Simple CSV Parser (robust & zero dependency)
const parseCSV = (content) => {
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const row = [];
        let inQuote = false;
        let start = 0;
        const line = lines[i];

        for (let j = 0; j < line.length; j++) {
            if (line[j] === '"') inQuote = !inQuote;
            else if (line[j] === ',' && !inQuote) {
                row.push(line.substring(start, j).replace(/^"|"$/g, '').trim());
                start = j + 1;
            }
        }
        row.push(line.substring(start).replace(/^"|"$/g, '').trim());

        const rowObj = {};

        // Safety: Ensure we don't exceed headers
        headers.forEach((h, idx) => {
            if (idx < row.length) {
                rowObj[h] = row[idx];
            }
        });

        // Filter out empty rows
        if (Object.values(rowObj).some(v => v)) {
            data.push(rowObj);
        }
    }
    return data;
};

const ingestQueries = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync Model
        await SavedQuery.sync({ alter: true });
        console.log('SavedQuery synced.');

        const files = fs.readdirSync(QUERIES_DIR).filter(f => f.endsWith('.csv'));
        console.log(`Found ${files.length} query files.`);

        for (const file of files) {
            console.log(`Processing ${file}...`);
            const content = fs.readFileSync(path.join(QUERIES_DIR, file), 'utf8');

            const cleanRecords = parseCSV(content);
            console.log(`Parsed ${cleanRecords.length} records.`);

            const queryName = file.replace('.csv', '').trim();

            const [query, created] = await SavedQuery.findOrCreate({
                where: { name: queryName },
                defaults: {
                    description: `Standard Report ingested from ${file}`,
                    type: 'static',
                    static_data: cleanRecords
                }
            });

            if (!created) {
                query.static_data = cleanRecords;
                query.type = 'static';
                await query.save();
                console.log(`Updated ${queryName}`);
            } else {
                console.log(`Created ${queryName}`);
            }
        }

        console.log("Ingestion Complete.");
        process.exit(0);

    } catch (error) {
        console.error("Ingestion Failed:", error);
        process.exit(1);
    }
};

ingestQueries();
