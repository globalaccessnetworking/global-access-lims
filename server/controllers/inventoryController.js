const { Chemical, PurchaseOrder, AuditLog } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

exports.getChemicals = async (req, res) => {
    try {
        const chemicals = await Chemical.findAll({
            order: [['name', 'ASC']]
        });
        res.json(chemicals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateVolume = async (req, res) => {
    const { id } = req.params;
    const { current_volume } = req.body;

    try {
        const chemical = await Chemical.findByPk(id);
        if (!chemical) {
            return res.status(404).json({ message: 'Chemical not found' });
        }

        chemical.current_volume = current_volume;
        await chemical.save();

        let alert = false;
        if (chemical.threshold_limit && current_volume <= chemical.threshold_limit) {
            alert = true;
            console.log(`Low stock alert: ${chemical.name}`);
        }

        // Audit Log
        await AuditLog.create({
            user_id: req.user.id,
            action: 'UPDATE_VOLUME',
            description: `Updated volume for ${chemical.name} to ${current_volume}`
        });

        res.json({ ...chemical.toJSON(), alert });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getLowStock = async (req, res) => {
    try {
        const lowStock = await Chemical.findAll({
            where: {
                current_volume: {
                    [Op.lte]: sequelize.col('threshold_limit')
                }
            }
        });
        res.json(lowStock);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ==========================================
// INVENTORY STOCK (NEW MODULE)
// ==========================================

const { InventoryStock } = require('../models');

exports.getAllStocks = async (req, res) => {
    try {
        const stocks = await InventoryStock.findAll({
            order: [['item_name', 'ASC']]
        });
        res.json(stocks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addStock = async (req, res) => {
    try {
        const newStock = await InventoryStock.create(req.body);
        res.json(newStock);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateStock = async (req, res) => {
    try {
        const stock = await InventoryStock.findByPk(req.params.id);
        if (!stock) return res.status(404).json({ msg: 'Item not found' });

        await stock.update(req.body);
        res.json(stock);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteStock = async (req, res) => {
    try {
        const stock = await InventoryStock.findByPk(req.params.id);
        if (!stock) return res.status(404).json({ msg: 'Item not found' });

        await stock.destroy();
        res.json({ msg: 'Item removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.upsertChemical = async (req, res) => {
    const {
        barcode,
        name,
        current_volume,
        threshold_limit,
        unit,
        ghs_hazards,
        signal_word,
        sds_url,
        qr_identity_string,
        max_volume,
        stock_alert_level,
        unit_type
    } = req.body;

    try {
        let chemical = null;
        if (barcode) {
            chemical = await Chemical.findOne({ where: { barcode } });
        }

        if (chemical) {
            // Update
            await chemical.update({
                name,
                current_volume,
                threshold_limit,
                unit,
                ghs_hazards,
                signal_word,
                sds_url,
                qr_identity_string,
                max_volume,
                stock_alert_level,
                unit_type
            });
        } else {
            // Create
            chemical = await Chemical.create({
                barcode,
                name,
                current_volume,
                threshold_limit,
                unit,
                ghs_hazards,
                signal_word,
                sds_url,
                qr_identity_string,
                max_volume: max_volume || current_volume,
                stock_alert_level,
                unit_type: unit_type || unit
            });
        }

        // Audit Log
        await AuditLog.create({
            user_id: req.user.id,
            action: chemical ? 'UPDATE_CHEMICAL' : 'CREATE_CHEMICAL',
            description: `${chemical ? 'Updated' : 'Created'} chemical: ${name} (${barcode})`
        });

        res.json(chemical);
    } catch (err) {
        console.error('Upsert Chemical Error:', err.message);
        res.status(500).json({ error: 'Failed to save chemical record' });
    }
};

exports.deleteChemical = async (req, res) => {
    try {
        const chemical = await Chemical.findByPk(req.params.id);
        if (!chemical) return res.status(404).json({ msg: 'Chemical not found' });

        await chemical.destroy();
        res.json({ msg: 'Chemical removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateChemical = async (req, res) => {
    const { id } = req.params;
    try {
        const chemical = await Chemical.findByPk(id);
        if (!chemical) return res.status(404).json({ error: 'Chemical not found' });

        await chemical.update(req.body);

        // Audit Log
        await AuditLog.create({
            user_id: req.user.id,
            action: 'UPDATE_CHEMICAL',
            description: `Updated chemical: ${chemical.name} (ID: ${id})`
        });

        res.json(chemical);
    } catch (err) {
        console.error('Update Chemical Error:', err.message);
        res.status(500).json({ error: 'Failed to update chemical record' });
    }
};

exports.lookupAsset = async (req, res) => {
    const { id, type, identity } = req.query;

    try {
        let asset = null;

        if (type === 'Chemical' || !type) {
            asset = await Chemical.findOne({
                where: {
                    [Op.or]: [
                        { id: id || -1 },
                        { qr_identity_string: identity || '' },
                        { barcode: identity || '' }
                    ]
                }
            });
            if (asset) return res.json({ success: true, asset });
        }

        if (type === 'Inventory' || !type) {
            asset = await InventoryStock.findOne({
                where: {
                    [Op.or]: [
                        { id: id || -1 },
                        { qr_identity_string: identity || '' },
                        { catalog_number: identity || '' }
                    ]
                }
            });
            if (asset) return res.json({ success: true, asset: { ...asset.toJSON(), name: asset.item_name } });
        }

        res.json({ success: false, message: 'Asset not found' });
    } catch (err) {
        console.error('Lookup Error:', err.message);
        res.status(500).send('Server Error');
    }
};
