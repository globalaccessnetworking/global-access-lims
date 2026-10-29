const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function searchAll() {
    try {
        const tables = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `, { type: Sequelize.QueryTypes.SELECT });

        for (const { table_name } of tables) {
            try {
                const cols = await sequelize.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '${table_name}'
                `, { type: Sequelize.QueryTypes.SELECT });

                for (const { column_name } of cols) {
                    try {
                        const res = await sequelize.query(
                            `SELECT id, "${column_name}" FROM "${table_name}" WHERE "${column_name}"::text = '222' LIMIT 5`,
                            { type: Sequelize.QueryTypes.SELECT }
                        );
                        if (res.length > 0) {
                            console.log(`FOUND 222 in table "${table_name}", column "${column_name}":`, res);
                        }
                    } catch(eCol) {}
                }
            } catch(eTable) {}
        }
        console.log('Search complete.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

searchAll();
