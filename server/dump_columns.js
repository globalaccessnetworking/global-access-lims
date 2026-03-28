require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');
const fs = require('fs');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
    }
);

async function dump() {
    try {
        await sequelize.authenticate();

        const getCols = async (table) => {
            const [results] = await sequelize.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`
            );
            return results.map(r => r.column_name);
        };

        const strains = await getCols('ext_bacterial_strains');
        const phages = await getCols('ext_bacteriophages');
        const stock = await getCols('ext_lab_stock');

        const output = `
STRAINS: ${JSON.stringify(strains)}
PHAGES: ${JSON.stringify(phages)}
STOCK: ${JSON.stringify(stock)}
`;
        fs.writeFileSync('schema_columns_final.txt', output);
        console.log("Done.");

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

dump();
