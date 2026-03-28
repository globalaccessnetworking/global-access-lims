const { Chemical, InventoryStock, sequelize } = require('../models');
const { Op } = require('sequelize');
const { QueryTypes } = require('sequelize');
const emailService = require('../services/emailService');

// Calculate priority based on urgency
const calculatePriority = (item, type) => {
    if (type === 'lowStock') {
        const ratio = item.quantity / item.threshold;
        if (ratio <= 0.25) return 'critical';
        if (ratio <= 0.5) return 'warning';
        return 'info';
    }

    if (type === 'expiring') {
        const daysUntilExpiry = Math.floor((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) return 'critical'; // Expired
        if (daysUntilExpiry <= 7) return 'critical';
        if (daysUntilExpiry <= 14) return 'warning';
        return 'info';
    }

    return 'info';
};

exports.getAlerts = async (req, res) => {
    try {
        const userId = req.user?.id;
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];

        // Get dismissed alerts for this user
        let dismissedAlerts = [];
        if (userId) {
            dismissedAlerts = await sequelize.query(`
                SELECT alert_type, alert_id FROM alert_dismissals
                WHERE user_id = :userId 
                AND (snoozed_until IS NULL OR snoozed_until > NOW())
            `, { replacements: { userId }, type: QueryTypes.SELECT });
        }

        const dismissedSet = new Set(dismissedAlerts.map(d => `${d.alert_type}-${d.alert_id}`));

        // 1. Low Stock Chemicals
        const lowStockChemicals = await Chemical.findAll({
            where: {
                current_volume: {
                    [Op.lte]: sequelize.col('threshold_limit')
                },
                threshold_limit: { [Op.gt]: 0 }
            }
        });

        // 2. Expiring Chemicals
        const expiringChemicals = await Chemical.findAll({
            where: {
                expiry_date: {
                    [Op.lte]: nextMonthStr
                }
            }
        });

        // 3. Low Stock Inventory
        const lowStockInventory = await InventoryStock.findAll({
            where: {
                available_quantity: {
                    [Op.lte]: sequelize.col('threshold_limit')
                },
                threshold_limit: { [Op.gt]: 0 }
            }
        });

        // 4. Expiring Inventory
        const expiringInventory = await InventoryStock.findAll({
            where: {
                expiry_date: {
                    [Op.lte]: nextMonthStr
                }
            }
        });

        // 5. Overdue Tasks
        const overdueTasks = await sequelize.query(`
            SELECT id, title as name, due_date as expiry
            FROM "ext_lab_tasks"
            WHERE due_date < :today AND status NOT IN ('Completed', 'Review')
        `, { replacements: { today }, type: QueryTypes.SELECT });

        // 6. Expiring Projects
        const expiringProjects = await sequelize.query(`
            SELECT id, name, end_date as expiry
            FROM "ext_lab_projects"
            WHERE end_date <= :nextMonthStr AND end_date >= :today AND status != 'Completed'
        `, { replacements: { nextMonthStr, today }, type: QueryTypes.SELECT });

        // Build alerts with priorities
        const lowStock = [
            ...lowStockChemicals.map(c => {
                const alert = { id: c.id, name: c.name, type: 'Chemical', quantity: c.current_volume, threshold: c.threshold_limit, unit: c.unit };
                alert.priority = calculatePriority(alert, 'lowStock');
                alert.alertId = `chemical-low-${c.id}`;
                return alert;
            }),
            ...lowStockInventory.map(i => {
                const alert = { id: i.id, name: i.item_name, type: 'Inventory', quantity: i.available_quantity, threshold: i.threshold_limit, unit: 'units' };
                alert.priority = calculatePriority(alert, 'lowStock');
                alert.alertId = `inventory-low-${i.id}`;
                return alert;
            })
        ].filter(alert => !dismissedSet.has(`lowStock-${alert.alertId}`));

        const expiring = [
            ...expiringChemicals.map(c => {
                const alert = { id: c.id, name: c.name, type: 'Chemical', expiry: c.expiry_date };
                alert.priority = calculatePriority(alert, 'expiring');
                alert.alertId = `chemical-exp-${c.id}`;
                return alert;
            }),
            ...expiringInventory.map(i => {
                const alert = { id: i.id, name: i.item_name, type: 'Inventory', expiry: i.expiry_date };
                alert.priority = calculatePriority(alert, 'expiring');
                alert.alertId = `inventory-exp-${i.id}`;
                return alert;
            }),
            ...(overdueTasks || []).map(t => {
                const alert = { id: t.id, name: t.name, type: 'Task Overdue', expiry: t.expiry, urgency: 'high', priority: 'critical' };
                alert.alertId = `task-${t.id}`;
                return alert;
            }),
            ...(expiringProjects || []).map(p => {
                const alert = { id: p.id, name: p.name, type: 'Project Deadline', expiry: p.expiry };
                alert.priority = calculatePriority(alert, 'expiring');
                alert.alertId = `project-${p.id}`;
                return alert;
            })
        ].filter(alert => !dismissedSet.has(`expiring-${alert.alertId}`));

        res.json({ lowStock, expiring });
    } catch (err) {
        console.error('Alerts Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// POST /api/alerts/dismiss
exports.dismissAlert = async (req, res) => {
    try {
        const { alertType, alertId, snoozeDays } = req.body;
        const userId = req.user.id;

        let snoozeUntil = null;
        if (snoozeDays) {
            snoozeUntil = new Date();
            snoozeUntil.setDate(snoozeUntil.getDate() + parseInt(snoozeDays));
        }

        await sequelize.query(`
            INSERT INTO alert_dismissals (user_id, alert_type, alert_id, snoozed_until)
            VALUES (:userId, :alertType, :alertId, :snoozeUntil)
            ON CONFLICT (user_id, alert_type, alert_id) 
            DO UPDATE SET snoozed_until = :snoozeUntil, dismissed_at = NOW()
        `, {
            replacements: { userId, alertType, alertId, snoozeUntil },
            type: QueryTypes.INSERT
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Dismiss alert error:', error);
        res.status(500).json({ error: 'Failed to dismiss alert' });
    }
};

// POST /api/alerts/send-digest
exports.sendDigest = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Get all alerts
        const alertsRes = await exports.getAlerts(req, { json: (data) => data });
        const allAlerts = [
            ...alertsRes.lowStock.map(a => ({ ...a, category: 'Low Stock', title: `Low Stock: ${a.name}`, message: `Current: ${a.quantity} ${a.unit}, Threshold: ${a.threshold} ${a.unit}` })),
            ...alertsRes.expiring.map(a => ({ ...a, category: 'Expiring', title: `${a.type}: ${a.name}`, message: `Expires: ${new Date(a.expiry).toLocaleDateString()}` }))
        ];

        if (allAlerts.length > 0) {
            await emailService.sendAlertDigest(userEmail, allAlerts);
            res.json({ success: true, sent: allAlerts.length });
        } else {
            res.json({ success: true, sent: 0, message: 'No alerts to send' });
        }
    } catch (error) {
        console.error('Send digest error:', error);
        res.status(500).json({ error: 'Failed to send digest' });
    }
};

