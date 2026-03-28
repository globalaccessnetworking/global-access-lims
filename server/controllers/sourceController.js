const Source = require('../models/Source');

exports.getSources = async (req, res) => {
    try {
        const sources = await Source.findAll();
        res.json(sources);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addSource = async (req, res) => {
    try {
        const { name, type, details } = req.body;
        const newSource = await Source.create({ name, type, details });
        res.json(newSource);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
