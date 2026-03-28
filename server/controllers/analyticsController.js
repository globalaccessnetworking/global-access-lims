const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// GET /api/analytics/success-trends
exports.getSuccessTrends = async (req, res) => {
    try {
        const trends = await sequelize.query(`
            SELECT 
                TO_CHAR(date, 'Mon YYYY') as month,
                COUNT(*) as total,
                SUM(CASE WHEN result = 'Success' THEN 1 ELSE 0 END) as successes,
                ROUND(100.0 * SUM(CASE WHEN result = 'Success' THEN 1 ELSE 0 END) / COUNT(*), 1) as "successRate"
            FROM "Experiments"
            WHERE date >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(date, 'Mon YYYY'), DATE_TRUNC('month', date)
            ORDER BY DATE_TRUNC('month', date)
        `, { type: QueryTypes.SELECT });

        res.json({ trends });
    } catch (error) {
        console.error('Success trends error:', error);
        res.status(500).json({ error: 'Failed to fetch success trends' });
    }
};

// GET /api/analytics/protocol-comparison
exports.getProtocolComparison = async (req, res) => {
    try {
        const protocols = await sequelize.query(`
            SELECT 
                protocol,
                COUNT(*) as total,
                SUM(CASE WHEN result = 'Success' THEN 1 ELSE 0 END) as "successCount",
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as "avgTime"
            FROM "Experiments"
            WHERE protocol IS NOT NULL
            GROUP BY protocol
            ORDER BY "successCount" DESC
            LIMIT 10
        `, { type: QueryTypes.SELECT });

        res.json({ protocols });
    } catch (error) {
        console.error('Protocol comparison error:', error);
        res.status(500).json({ error: 'Failed to fetch protocol comparison' });
    }
};

// GET /api/analytics/storage-utilization
exports.getStorageUtilization = async (req, res) => {
    try {
        const utilization = await sequelize.query(`
            SELECT 
                'Bacterial Strains' as name,
                COUNT(*) as value
            FROM "ext_bacterial_strains"
            UNION ALL
            SELECT 
                'Bacteriophages' as name,
                COUNT(*) as value
            FROM "ext_bacteriophages"
            UNION ALL
            SELECT 
                'Primers' as name,
                COUNT(*) as value
            FROM "ext_primers_details"
            UNION ALL
            SELECT 
                'Chemicals' as name,
                COUNT(*) as value
            FROM "Chemicals"
        `, { type: QueryTypes.SELECT });

        res.json({ utilization });
    } catch (error) {
        console.error('Storage utilization error:', error);
        res.status(500).json({ error: 'Failed to fetch storage utilization' });
    }
};

// GET /api/analytics/activity-timeline
exports.getActivityTimeline = async (req, res) => {
    try {
        const timeline = await sequelize.query(`
            SELECT 
                TO_CHAR(created_at, 'Dy') as day,
                SUM(CASE WHEN entity_type = 'experiment' THEN 1 ELSE 0 END) as experiments,
                SUM(CASE WHEN entity_type IN ('strain', 'phage', 'primer') THEN 1 ELSE 0 END) as samples,
                SUM(CASE WHEN entity_type = 'task' THEN 1 ELSE 0 END) as tasks
            FROM activity_log
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY TO_CHAR(created_at, 'Dy'), DATE_TRUNC('day', created_at)
            ORDER BY DATE_TRUNC('day', created_at)
        `, { type: QueryTypes.SELECT });

        res.json({ timeline });
    } catch (error) {
        console.error('Activity timeline error:', error);
        res.status(500).json({ error: 'Failed to fetch activity timeline' });
    }
};

// GET /api/analytics (Main Dashboard Summary)
exports.getAnalyticsSummary = async (req, res) => {
    try {
        // 1. Inventory Summary (Using activity_log for counts of created entities)
        const inventory = await sequelize.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN action_type != 'deleted' THEN 1 ELSE 0 END) as healthy
            FROM activity_log
            WHERE action_type IN ('created', 'deleted')
            AND entity_type IN ('strain', 'phage', 'primer')
        `, { type: QueryTypes.SELECT });

        // 2. Task Stats
        const taskStatus = await sequelize.query(`
            SELECT status, COUNT(*) as count 
            FROM "ext_lab_tasks" 
            GROUP BY status
        `, { type: QueryTypes.SELECT });

        const taskPriority = await sequelize.query(`
            SELECT priority, COUNT(*) as count 
            FROM "ext_lab_tasks" 
            GROUP BY priority
        `, { type: QueryTypes.SELECT });

        // 3. Asset Growth (Last 6 Months using activity_log)
        const assetGrowth = await sequelize.query(`
            SELECT 
                DATE_TRUNC('month', created_at) as month, 
                CASE 
                    WHEN entity_type = 'strain' THEN 'Strain' 
                    WHEN entity_type = 'phage' THEN 'Phage' 
                    ELSE 'Other' 
                END as type, 
                COUNT(*) as count 
            FROM activity_log 
            WHERE action_type = 'created' 
            AND entity_type IN ('strain', 'phage') 
            AND created_at >= NOW() - INTERVAL '6 months' 
            GROUP BY month, type 
            ORDER BY month ASC
        `, { type: QueryTypes.SELECT });

        // 4. Protocol Distribution
        const protocols = await sequelize.query(`
            SELECT 
                protocol, 
                COUNT(*) as count 
            FROM "Experiments" 
            WHERE protocol IS NOT NULL 
            GROUP BY protocol
            ORDER BY count DESC
            LIMIT 5
        `, { type: QueryTypes.SELECT });

        res.json({
            inventory: {
                total: parseInt(inventory[0]?.total) || 0,
                healthy: parseInt(inventory[0]?.healthy) || 0
            },
            tasks: {
                status: taskStatus.map(t => ({ status: t.status, count: parseInt(t.count) })),
                priority: taskPriority.map(t => ({ priority: t.priority, count: parseInt(t.count) }))
            },
            assetGrowth: assetGrowth.map(g => ({
                month: g.month,
                type: g.type,
                count: parseInt(g.count)
            })),
            protocols: protocols.map(p => ({
                protocol: p.protocol,
                count: parseInt(p.count)
            }))
        });
    } catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ error: 'Failed to compute laboratory intelligence' });
    }
};
