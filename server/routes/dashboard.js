const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { auth } = require('../middleware/auth');

router.get('/stats', async (req, res) => {
    try {
        // 1. Bacterial Strains Count
        const strainResult = await sequelize.query(
            `SELECT COUNT(*) as count FROM "ext_bacterial_strains"`,
            { type: QueryTypes.SELECT }
        );
        const strainCount = parseInt(strainResult[0]?.count || 0, 10);

        // 2. Phage Library Count
        const phageResult = await sequelize.query(
            `SELECT COUNT(*) as count FROM "ext_bacteriophages"`,
            { type: QueryTypes.SELECT }
        );
        const phageCount = parseInt(phageResult[0]?.count || 0, 10);

        // 3. Inventory Items
        const inventoryResult = await sequelize.query(
            `SELECT COUNT(*) as count FROM "ext_lab_stock"`,
            { type: QueryTypes.SELECT }
        );
        const inventoryCount = parseInt(inventoryResult[0]?.count || 0, 10);

        // 4. Low Stock
        let lowStockCount = 0;
        try {
            const lowStockResult = await sequelize.query(
                `SELECT COUNT(*) as count FROM "ext_lab_stock" WHERE "Available_Quantity"::numeric < 5`,
                { type: QueryTypes.SELECT }
            );
            lowStockCount = parseInt(lowStockResult[0]?.count || 0, 10);
        } catch (e) {
            console.warn("Low stock query failed:", e.message);
        }

        // 5. Active Projects Count (Planning, Active, Review, etc.)
        let projectCount = 0;
        try {
            const projectResult = await sequelize.query(
                `SELECT COUNT(*) as count FROM "ext_lab_projects" WHERE status NOT IN ('Completed', 'Finished', 'Archived')`,
                { type: QueryTypes.SELECT }
            );
            projectCount = parseInt(projectResult[0]?.count || 0, 10);
        } catch (e) { }

        // 6. Top 5 Bacterial Species
        const topSpecies = await sequelize.query(
            `SELECT "Specie" as species, COUNT(*) as count 
             FROM "ext_bacterial_strains" 
             GROUP BY "Specie" 
             ORDER BY count DESC 
             LIMIT 5`,
            { type: QueryTypes.SELECT }
        );

        res.json({
            metrics: {
                totalStrains: strainCount,
                totalPhages: phageCount,
                totalInventory: inventoryCount,
                lowStock: lowStockCount,
                activeProjects: projectCount
            },
            topSpecies: topSpecies
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
