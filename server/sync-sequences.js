const { sequelize } = require('./server/models');
const { Sequelize } = require('sequelize');

async function syncSequences() {
    try {
        console.log('Syncing all Postgres sequences...');
        
        // 1. Get all tables and their columns with 'nextval' defaults
        const cols = await sequelize.query(`
            SELECT table_name, column_name, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
              AND column_default LIKE 'nextval(%'
        `, { type: Sequelize.QueryTypes.SELECT });
        
        for (const col of cols) {
            const table = col.table_name;
            const column = col.column_name;
            const seqMatch = col.column_default.match(/nextval\('([^']+)'/);
            
            if (seqMatch) {
                const seqName = seqMatch[1];
                
                // 2. Get the MAX value from the table
                const maxRes = await sequelize.query(`SELECT MAX("${column}") as maxid FROM "${table}"`, { type: Sequelize.QueryTypes.SELECT });
                const maxId = maxRes[0]?.maxid;
                
                if (maxId) {
                    // 3. Set the sequence to maxId + 1
                    await sequelize.query(`SELECT setval('${seqName}', ${maxId})`, { type: Sequelize.QueryTypes.SELECT });
                    console.log(`Synced ${table}.${column} sequence '${seqName}' to ${maxId}`);
                } else {
                    console.log(`Table ${table} is empty. Sequence left alone.`);
                }
            }
        }
        console.log('All sequences synced successfully.');
    } catch (err) {
        console.error('Error syncing sequences:', err);
    }
}

syncSequences();
