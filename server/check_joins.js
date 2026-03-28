const sequelize = require('./config/database');

async function checkData() {
    try {
        await sequelize.authenticate();

        const [sl] = await sequelize.query(`SELECT * FROM "StorageLocations" LIMIT 1`);
        console.log("StorageLocations Sample:", sl[0]);

        const [ef] = await sequelize.query(`SELECT * FROM "ext_location_detail_freezer" LIMIT 1`);
        console.log("ext_location_detail_freezer Sample:", ef[0]);

        const [er] = await sequelize.query(`SELECT * FROM "ext_location_detail_rack" LIMIT 1`);
        console.log("ext_location_detail_rack Sample:", er[0]);

        // Also check if there are StorageLocations with numeric freezer names/rack/box
        const [numericCheck] = await sequelize.query(`
            SELECT count(*) as count 
            FROM "StorageLocations" 
            WHERE "freezer_name" ~ '^[0-9]+$' 
            OR "rack" ~ '^[0-9]+$' 
            OR "box" ~ '^[0-9]+$'
        `);
        console.log("Numeric Count in StorageLocations:", numericCheck[0]);

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkData();
