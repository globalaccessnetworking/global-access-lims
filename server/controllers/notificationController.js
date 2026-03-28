const { Notification } = require('../models');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
    try {
        const query = {
            limit: 50,
            order: [['created_at', 'DESC']]
        };

        // If not admin, filter by user_id or system-wide (null user_id)
        if (req.user && req.user.role !== 'SuperAdmin' && req.user.role !== 'Admin') {
            console.log(`[NOTIFICATIONS] Filtering for User ID: ${req.user.id}`);
            query.where = {
                [Op.or]: [
                    { user_id: req.user.id },
                    { user_id: null }
                ]
            };
        } else {
            console.log(`[NOTIFICATIONS] Admin view - fetching all system notifications`);
        }

        const notifications = await Notification.findAll(query);
        res.json(notifications);
    } catch (err) {
        console.error('getNotifications Error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        if (req.params.id === 'all') {
            console.log(`[NOTIFICATIONS] Marking all as read for User: ${userId}`);
            await Notification.update({ is_read: true }, {
                where: {
                    is_read: false,
                    [Op.or]: [{ user_id: userId }, { user_id: null }]
                }
            });
        } else {
            const notification = await Notification.findByPk(req.params.id);
            if (notification) {
                // Security check: can only mark their own as read
                if (notification.user_id && notification.user_id !== userId && req.user.role !== 'SuperAdmin') {
                    return res.status(403).json({ msg: 'Unauthorized' });
                }
                notification.is_read = true;
                await notification.save();
            }
        }
        res.json({ msg: 'Marked as read' });
    } catch (err) {
        console.error('markAsRead Error:', err.message);
        res.status(500).send('Server Error');
    }
};
