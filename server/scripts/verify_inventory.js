const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { InventoryStock, sequelize } = require('../models');

async function verify() {
    try {
        await sequelize.authenticate();
        const stocks = await InventoryStock.findAll({
            order: [['id', 'ASC']], // Assuming CSV order matches ID order due to insertion order
            limit: 5
        });

        console.log('Top 5 Inventory Items:');
        stocks.forEach(s => {
            console.log(`${s.id}: ${s.item_name} (Qty: ${s.available_quantity})`);
        });

        const target = await InventoryStock.findOne({ where: { item_name: 'Thermo Scientific ECL' } });
        if (target) {
            console.log('\nFOUND TARGET:');
            console.log(target.toJSON());
        } else {
            console.log('\nTARGET "Thermo Scientific ECL" NOT FOUND.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
