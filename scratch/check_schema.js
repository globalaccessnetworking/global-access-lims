const { sequelize } = require('./server/models');
async function check() {
    try {
        const [results] = await sequelize.query('SELECT * FROM "ext_lab_stock" LIMIT 1');
        console.log("ext_lab_stock columns:", Object.keys(results[0] || {}));
        
        // Also check if barcode is in ext_lab_stock
        console.log("Sample Data:", results[0]);
        
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
check();
