require('dotenv').config({ path: '.env' });
const { Sequelize, QueryTypes } = require('sequelize');
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

async function inspectContent() {
    try {
        await sequelize.authenticate();

        const strains = await sequelize.query(
            `SELECT "id", "Specie", "Strain_No", "Detail_of_Bacterial_Strain" FROM "ext_bacterial_strains" LIMIT 5`,
            { type: QueryTypes.SELECT }
        );
        const phages = await sequelize.query(
            `SELECT "id", "Bacteriophage_Name" FROM "ext_bacteriophages" LIMIT 5`,
            { type: QueryTypes.SELECT }
        );

        const output = `
STRAINS: ${JSON.stringify(strains, null, 2)}
PHAGES: ${JSON.stringify(phages, null, 2)}
`;
        fs.writeFileSync('data_dump.txt', output);

    } catch (e) {
        console.error(e);
        fs.writeFileSync('data_dump.txt', e.message);
    } finally {
        await sequelize.close();
    }
}

inspectContent();
