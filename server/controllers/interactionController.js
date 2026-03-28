const { PhageHostInteraction, BiologicalAsset } = require('../models');

exports.getInteractionMatrix = async (req, res) => {
    try {
        const interactions = await PhageHostInteraction.findAll({
            include: [
                { model: BiologicalAsset, as: 'Phage', attributes: ['id', 'strain_number', 'species'] },
                { model: BiologicalAsset, as: 'Host', attributes: ['id', 'strain_number', 'species'] }
            ]
        });
        res.json(interactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.toggleInteraction = async (req, res) => {
    try {
        const { phage_id, host_id, sensitivity } = req.body;

        // Find existing or create new
        let interaction = await PhageHostInteraction.findOne({ where: { phage_id, host_id } });

        if (interaction) {
            interaction.sensitivity = sensitivity;
            await interaction.save();
        } else {
            interaction = await PhageHostInteraction.create({ phage_id, host_id, sensitivity });
        }

        res.json(interaction);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
