const express = require('express');
const router = express.Router();
const { BiologicalAsset, Project, LabTask, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const { Op, QueryTypes } = require('sequelize');

router.get('/stats', async (req, res) => {
    try {
        console.log('--- START DASHBOARD STATS FETCH ---');
        // 1. Counts using Raw SQL from 100% verified tables
        const [ { strainCount } ] = await sequelize.query('SELECT COUNT(*) as "strainCount" FROM "ext_bacterial_strains"', { type: QueryTypes.SELECT });
        const [ { phageCount } ] = await sequelize.query('SELECT COUNT(*) as "phageCount" FROM "ext_bacteriophages"', { type: QueryTypes.SELECT });
        const [ { inventoryCount } ] = await sequelize.query('SELECT COUNT(*) as "inventoryCount" FROM "ext_lab_stock"', { type: QueryTypes.SELECT });
        const [ { projectCount } ] = await sequelize.query('SELECT COUNT(*) as "projectCount" FROM "ext_lab_projects"', { type: QueryTypes.SELECT });
        
        // 2. Low Stock (Using canonical Available_Quantity column)
        const [ { lowStockCount } ] = await sequelize.query(`SELECT COUNT(*) as "lowStockCount" FROM "ext_lab_stock" WHERE "Available_Quantity" ~ '^[0-9]+$' AND CAST("Available_Quantity" AS INTEGER) < 5`, { type: QueryTypes.SELECT });

        // 3. Top 5 Bacterial Species
        const topSpecies = await sequelize.query(`
            SELECT bs."Species" as species, COUNT(*) as count
            FROM "ext_bacterial_strains" ebs
            LEFT JOIN "bacterial_species" bs ON CAST(ebs."Specie" AS TEXT) = CAST(bs."ID" AS TEXT)
            GROUP BY bs."Species"
            ORDER BY count DESC
            LIMIT 5
        `, { type: QueryTypes.SELECT });

        console.log('Stats Fetched Successfully:', { strainCount, phageCount, inventoryCount });

        res.json({
            metrics: {
                totalStrains: parseInt(strainCount || 0),
                totalPhages: parseInt(phageCount || 0),
                totalInventory: parseInt(inventoryCount || 0),
                lowStock: parseInt(lowStockCount || 0),
                activeProjects: parseInt(projectCount || 0)
            },
            topSpecies: topSpecies.map(s => ({
                species: s.species || 'Unknown',
                count: parseInt(s.count)
            }))
        });

    } catch (error) {
        console.error('CRITICAL DASHBOARD ERROR:', error.message);
        console.error(error.stack);
        res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
    }
});


// @route   GET api/dashboard/user-tasks
// @desc    Get pending tasks for logged in user
// @access  Private
router.get('/user-tasks', auth, async (req, res) => {
    try {
        const tasks = await LabTask.findAll({
            include: [{ model: Project, attributes: ['name'] }],
            order: [['createdAt', 'DESC']],
            limit: 20
        });

        res.json(tasks);
    } catch (error) {
        console.error('User Tasks Error:', error);
        res.status(500).json({ error: 'Failed to fetch user tasks' });
    }
});


module.exports = router;
