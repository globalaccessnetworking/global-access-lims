const { sequelize } = require('./server/models');
async function run() {
    const p = await sequelize.query(`SELECT b.id, b."Bacteriophage_Name", n."Bacteriophage_Name" as real_name FROM ext_bacteriophages b LEFT JOIN phage_names n ON n."ID"::text = b."Bacteriophage_Name"::text`);
    console.log(p[0].filter(x => String(x.Bacteriophage_Name) === '62' || String(x.Bacteriophage_Name) === '65' || String(x.Bacteriophage_Name) === '66' || x.id === 62 || x.id === 65 || x.id === 66));
    process.exit(0);
}
run();
