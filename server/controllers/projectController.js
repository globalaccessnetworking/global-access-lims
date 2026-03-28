const { Project, LabTask, User, Experiment } = require('../models');
const { sequelize } = require('../models');
const { getAccessibleProjects } = require('../middleware/projectAccess');

exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.findAll({
            include: [
                { model: User, as: 'Lead', attributes: ['id', 'username'] },
                { model: LabTask, attributes: ['id', 'status'] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createProject = async (req, res) => {
    try {
        const project = await Project.create(req.body);
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getProjectDetails = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, {
            include: [
                { model: User, as: 'Lead', attributes: ['id', 'username'] },
                {
                    model: LabTask,
                    include: [{ model: User, as: 'Assignee', attributes: ['id', 'username'] }]
                },
                { model: Experiment }
            ]
        });
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        await project.update(req.body);
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        await project.destroy();
        res.json({ msg: 'Project removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ===== MEMBER MANAGEMENT =====

/**
 * Get all members of a project
 */
exports.getProjectMembers = async (req, res) => {
    try {
        const { projectId } = req.params;

        const [members] = await sequelize.query(
            `SELECT pm.*, u.username, u.email, u2.username as added_by_name
             FROM project_members pm
             INNER JOIN "Users" u ON pm.user_id = u.id
             LEFT JOIN "Users" u2 ON pm.added_by = u2.id
             WHERE pm.project_id = $1
             ORDER BY pm.role DESC, pm.added_at ASC`,
            { bind: [parseInt(projectId)] }
        );

        res.json({ members });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Add a member to a project
 */
exports.addProjectMember = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, role = 'member' } = req.body;
        const addedBy = req.user?.id;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check if user exists
        const [users] = await sequelize.query(
            `SELECT id, username FROM "Users" WHERE id = $1`,
            { bind: [parseInt(userId)] }
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already a member
        const [existing] = await sequelize.query(
            `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`,
            { bind: [parseInt(projectId), parseInt(userId)] }
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'User is already a member of this project' });
        }

        // Add member
        const [result] = await sequelize.query(
            `INSERT INTO project_members (project_id, user_id, role, added_by)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            { bind: [parseInt(projectId), parseInt(userId), role, addedBy] }
        );

        res.json({ success: true, member: result[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Remove a member from a project
 */
exports.removeProjectMember = async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        // Check if member exists
        const [members] = await sequelize.query(
            `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
            { bind: [parseInt(projectId), parseInt(userId)] }
        );

        if (members.length === 0) {
            return res.status(404).json({ error: 'Member not found in this project' });
        }

        // Prevent removing the last owner
        if (members[0].role === 'owner') {
            const [ownerCount] = await sequelize.query(
                `SELECT COUNT(*) as count FROM project_members WHERE project_id = $1 AND role = 'owner'`,
                { bind: [parseInt(projectId)] }
            );

            if (parseInt(ownerCount[0].count) <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last owner. Assign another owner first.' });
            }
        }

        // Remove member
        await sequelize.query(
            `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
            { bind: [parseInt(projectId), parseInt(userId)] }
        );

        res.json({ success: true, message: 'Member removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Update a member's role
 */
exports.updateMemberRole = async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const { role } = req.body;

        if (!['owner', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be owner, member, or viewer.' });
        }

        // Check if member exists
        const [members] = await sequelize.query(
            `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
            { bind: [parseInt(projectId), parseInt(userId)] }
        );

        if (members.length === 0) {
            return res.status(404).json({ error: 'Member not found in this project' });
        }

        const currentRole = members[0].role;

        // Prevent demoting the last owner
        if (currentRole === 'owner' && role !== 'owner') {
            const [ownerCount] = await sequelize.query(
                `SELECT COUNT(*) as count FROM project_members WHERE project_id = $1 AND role = 'owner'`,
                { bind: [parseInt(projectId)] }
            );

            if (parseInt(ownerCount[0].count) <= 1) {
                return res.status(400).json({ error: 'Cannot demote the last owner. Assign another owner first.' });
            }
        }

        // Update role
        await sequelize.query(
            `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3`,
            { bind: [role, parseInt(projectId), parseInt(userId)] }
        );

        res.json({ success: true, message: 'Role updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
