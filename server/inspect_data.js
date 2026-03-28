require('dotenv').config({ path: '.env' });
const { Sequelize, QueryTypes } = require('sequelize');

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

        console.log("--- Strains Sample ---");
        const strains = await sequelize.query(
            `SELECT "id", "Specie", "Strain_No", "Designation" FROM "ext_bacterial_strains" LIMIT 5`,
            { type: QueryTypes.SELECT }
        );
        console.log(JSON.stringify(strains, null, 2));

        console.log("--- Phages Sample ---");
        const phages = await sequelize.query(
            `SELECT "id", "Bacteriophage_Name" FROM "ext_bacteriophages" LIMIT 5`,
            { type: QueryTypes.SELECT }
        );
        console.log(JSON.stringify(phages, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

inspectContent();
