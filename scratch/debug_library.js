const { sequelize } = require('./server/models');
const { QueryTypes } = require('sequelize');

async function debugData() {
    try {
        console.log("--- DEBUGGING BIO LIBRARY DATA ---");
        
        const tables = [
            { name: 'ext_bacterial_strains', idCol: 'id', nameCol: 'Strain_No' },
            { name: 'ext_bacteriophages', idCol: 'id', nameCol: 'Bacteriophage_Name' },
            { name: 'ext_primers_details', idCol: 'ID', nameCol: 'Primer_Name' },
            { name: 'ext_plasmids', idCol: 'id', nameCol: 'Plasmid_Name' }
        ];

        for (const t of tables) {
            try {
                const [count] = await sequelize.query(`SELECT count(*) FROM "${t.name}"`);
                console.log(`Table ${t.name} Count:`, count[0].count);
                
                if (count[0].count > 0) {
                    const [sample] = await sequelize.query(`SELECT * FROM "${t.name}" LIMIT 1`);
                    console.log(`Table ${t.name} Sample Columns:`, Object.keys(sample[0]));
                }
            } catch (e) {
                console.error(`Error querying ${t.name}:`, e.message);
                
                // If it fails, maybe the table name is slightly different?
                const [names] = await sequelize.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_name ILIKE '%${t.name.split('_')[1]}%'
                `);
                console.log(`Possible table names matching ${t.name}:`, names.map(n => n.table_name));
            }
        }
        
    } catch (err) {
        console.error("Debug Script Critical Error:", err);
    } finally {
        process.exit(0);
    }
}

debugData();
