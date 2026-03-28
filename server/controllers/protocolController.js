const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// GET /api/protocols
exports.getProtocols = async (req, res) => {
    try {
        const protocols = await sequelize.query(`
            SELECT id, name, description, category, estimated_time, steps, created_at
            FROM protocols
            ORDER BY name
        `, { type: QueryTypes.SELECT });

        // Parse JSON steps
        const parsedProtocols = protocols.map(p => ({
            ...p,
            steps: JSON.parse(p.steps || '[]')
        }));

        res.json({ protocols: parsedProtocols });
    } catch (error) {
        console.error('Get protocols error:', error);
        res.status(500).json({ error: 'Failed to fetch protocols' });
    }
};

// GET /api/protocols/:id
exports.getProtocol = async (req, res) => {
    try {
        const { id } = req.params;

        const [protocol] = await sequelize.query(`
            SELECT id, name, description, category, estimated_time, steps, created_at
            FROM protocols
            WHERE id = :id
        `, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        if (!protocol) {
            return res.status(404).json({ error: 'Protocol not found' });
        }

        protocol.steps = JSON.parse(protocol.steps || '[]');
        res.json({ protocol });
    } catch (error) {
        console.error('Get protocol error:', error);
        res.status(500).json({ error: 'Failed to fetch protocol' });
    }
};

// POST /api/protocols
exports.createProtocol = async (req, res) => {
    try {
        const { name, description, category, estimatedTime, steps } = req.body;

        const [protocol] = await sequelize.query(`
            INSERT INTO protocols (name, description, category, estimated_time, steps)
            VALUES (:name, :description, :category, :estimatedTime, :steps)
            RETURNING *
        `, {
            replacements: {
                name,
                description,
                category,
                estimatedTime,
                steps: JSON.stringify(steps)
            },
            type: QueryTypes.INSERT
        });

        res.json({ protocol });
    } catch (error) {
        console.error('Create protocol error:', error);
        res.status(500).json({ error: 'Failed to create protocol' });
    }
};

// POST /api/protocols/:id/execute
exports.startProtocolExecution = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { experimentId } = req.body;

        const [execution] = await sequelize.query(`
            INSERT INTO protocol_executions (protocol_id, user_id, experiment_id, status, current_step, step_data)
            VALUES (:protocolId, :userId, :experimentId, 'in_progress', 0, '{}')
            RETURNING *
        `, {
            replacements: {
                protocolId: id,
                userId,
                experimentId: experimentId || null
            },
            type: QueryTypes.INSERT
        });

        res.json({ execution });
    } catch (error) {
        console.error('Start execution error:', error);
        res.status(500).json({ error: 'Failed to start protocol execution' });
    }
};

// PUT /api/protocols/executions/:id/step
exports.updateExecutionStep = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentStep, stepData, status } = req.body;

        await sequelize.query(`
            UPDATE protocol_executions
            SET current_step = :currentStep,
                step_data = :stepData,
                status = :status,
                updated_at = NOW()
            WHERE id = :id
        `, {
            replacements: {
                id,
                currentStep,
                stepData: JSON.stringify(stepData),
                status
            },
            type: QueryTypes.UPDATE
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Update execution step error:', error);
        res.status(500).json({ error: 'Failed to update execution step' });
    }
};

// GET /api/protocols/executions/active
exports.getActiveExecutions = async (req, res) => {
    try {
        const userId = req.user.id;

        const executions = await sequelize.query(`
            SELECT 
                pe.id,
                pe.protocol_id,
                pe.current_step,
                pe.status,
                pe.step_data,
                pe.created_at,
                p.name as protocol_name,
                p.steps,
                p.estimated_time
            FROM protocol_executions pe
            JOIN protocols p ON pe.protocol_id = p.id
            WHERE pe.user_id = :userId
            AND pe.status = 'in_progress'
            ORDER BY pe.created_at DESC
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        const parsedExecutions = executions.map(e => ({
            ...e,
            steps: JSON.parse(e.steps || '[]'),
            step_data: JSON.parse(e.step_data || '{}')
        }));

        res.json({ executions: parsedExecutions });
    } catch (error) {
        console.error('Get active executions error:', error);
        res.status(500).json({ error: 'Failed to fetch active executions' });
    }
};
