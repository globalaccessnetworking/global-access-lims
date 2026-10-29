const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');

async function test() {
    try {
        const phages = await sequelize.query(`SELECT b.id, n."Bacteriophage_Name" FROM ext_bacteriophages b LEFT JOIN phage_names n ON n."ID"::text = b."Bacteriophage_Name"::text WHERE n."Bacteriophage_Name" = 'SGP-3'`, { type: QueryTypes.SELECT });
        console.log("SGP-3 Phages:", phages);
    } catch (e) {
        console.error(e);
    }
}
test();
