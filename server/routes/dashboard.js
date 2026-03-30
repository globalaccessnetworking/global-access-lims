const express = require('express');
const router = express.Router();
const { BiologicalAsset, Project, InventoryStock, sequelize } = require('../models');

router.get('/stats', async (req, res) => {
    try {
        // 1. Counts using Sequelize Models
        const strainCount = await BiologicalAsset.count({ where: { type: 'Strain' } });
        const phageCount = await BiologicalAsset.count({ where: { type: 'Phage' } });
        const inventoryCount = await InventoryStock.count();
        const projectCount = await Project.count({ where: { status: 'Active' } });
        
        // 2. Low Stock (Placeholder logic for now)
        const lowStockCount = await InventoryStock.count({
            where: {
                available_quantity: { [require('sequelize').Op.lt]: 5 }
            }
        });

        // 3. Top 5 Bacterial Species (Aggregation)
        const topSpecies = await BiologicalAsset.findAll({
            attributes: [
                'species',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: { type: 'Strain' },
            group: ['species'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 5
        });

        res.json({
            metrics: {
                totalStrains: strainCount,
                totalPhages: phageCount,
                totalInventory: inventoryCount,
                lowStock: lowStockCount,
                activeProjects: projectCount
            },
            topSpecies: topSpecies.map(s => ({
                species: s.species || 'Unknown',
                count: parseInt(s.get('count'))
            }))
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});


// @route   GET api/dashboard/user-tasks
// @desc    Get pending tasks for logged in user
// @access  Private
router.get('/user-tasks', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // This is the EXACT query that worked during diagnostics
        const query = `
            SELECT t.*, p.name as project_name 
            FROM "ext_lab_tasks" t
            LEFT JOIN "ext_lab_projects" p ON t.project_id = p.id
            ORDER BY t.created_at DESC
            LIMIT 20
        `;

        const tasks = await sequelize.query(query, {
            type: QueryTypes.SELECT
        });

        res.json(tasks);
    } catch (error) {
        console.error('User Tasks Error:', error);
        res.status(500).json({ error: 'Failed to fetch user tasks' });
    }
});

module.exports = router;
