const { AuditLog, User } = require('../models');

exports.getLogs = async (req, res) => {
    try {
        const logs = await AuditLog.findAll({
            include: [{ model: User, attributes: ['username'] }],
            order: [['timestamp', 'DESC']]
        });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
