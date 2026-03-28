const { Experiment, User, BiologicalAsset, ExperimentComment } = require('../models');

exports.getExperiments = async (req, res) => {
    try {
        const experiments = await Experiment.findAll({
            include: [
                { model: User, attributes: ['username'] },
                { model: BiologicalAsset, attributes: ['strain_number', 'species'] },
                {
                    model: ExperimentComment,
                    include: [{ model: User, attributes: ['username'] }]
                }
            ],
            order: [['date', 'DESC']]
        });
        res.json(experiments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createExperiment = async (req, res) => {
    try {
        const { title, date, protocol, asset_id, notes, attachments, outcome, outcome_notes } = req.body;

        const experiment = await Experiment.create({
            title,
            date,
            protocol,
            asset_id,
            notes,
            attachments,
            outcome: outcome || 'pending',
            outcome_notes: outcome_notes || '',
            completed_at: outcome && outcome !== 'pending' ? new Date() : null,
            researcher_id: req.user.id
        });

        res.json(experiment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addComment = async (req, res) => {
    try {
        const { experiment_id, content } = req.body;
        const comment = await ExperimentComment.create({
            experiment_id,
            content,
            user_id: req.user.id
        });

        const fullComment = await ExperimentComment.findByPk(comment.id, {
            include: [{ model: User, attributes: ['username'] }]
        });

        res.json(fullComment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
