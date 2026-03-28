const { AvailableAntibiotic, AuditLog } = require('../models');

exports.getAntibiotics = async (req, res) => {
    try {
        const antibiotics = await AvailableAntibiotic.findAll();
        res.json(antibiotics);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addAntibiotic = async (req, res) => {
    const { name, quantity } = req.body;

    try {
        // Check if exists
        let antibiotic = await AvailableAntibiotic.findOne({ where: { name } });

        if (antibiotic) {
            // Update quantity
            antibiotic.quantity = parseInt(antibiotic.quantity) + parseInt(quantity);
            await antibiotic.save();
        } else {
            // Create new
            antibiotic = await AvailableAntibiotic.create({
                name,
                quantity
            });
        }

        // Log it
        await AuditLog.create({
            user_id: req.user.id,
            action: 'ADD_ANTIBIOTIC',
            description: `Added ${quantity} discs of ${name}`
        });

        res.json(antibiotic);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
