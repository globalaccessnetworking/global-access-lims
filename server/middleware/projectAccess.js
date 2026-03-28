const { sequelize } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Middleware to check if user has access to a project
 * @param {string} requiredRole - Minimum role required ('viewer', 'member', 'owner')
 */
const checkProjectAccess = (requiredRole = 'viewer') => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const projectId = req.params.projectId || req.body.project_id || req.query.project_id;

            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            if (!projectId) {
                // If no project specified, allow access (for listing all accessible projects)
                return next();
            }

            // Check if user is super admin
            const [users] = await sequelize.query(
                `SELECT role, username FROM "Users" WHERE id = $1`,
                { bind: [userId] }
            );

            if (users.length > 0 && (users[0].role === 'SuperAdmin' || users[0].username === 'admin')) {
                return next();
            }

            // Check project membership
            const [members] = await sequelize.query(
                `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
                { bind: [parseInt(projectId), userId] }
            );

            if (members.length === 0) {
                return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
            }

            const userRole = members[0].role;

            // Role hierarchy: owner > member > viewer
            const roleHierarchy = { viewer: 1, member: 2, owner: 3 };
            const userRoleLevel = roleHierarchy[userRole] || 0;
            const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

            if (userRoleLevel < requiredRoleLevel) {
                return res.status(403).json({
                    error: `Access denied. ${requiredRole} role required, you have ${userRole} role.`
                });
            }

            // Attach user's role to request for further use
            req.projectRole = userRole;
            next();

        } catch (error) {
            console.error('Project access check error:', error);
            res.status(500).json({ error: error.message });
        }
    };
};

/**
 * Get all projects accessible to the current user
 */
const getAccessibleProjects = async (userId) => {
    try {
        // Check if user is super admin
        const [users] = await sequelize.query(
            `SELECT role, username FROM "Users" WHERE id = $1`,
            { bind: [userId] }
        );

        if (users.length > 0 && (users[0].role === 'SuperAdmin' || users[0].username === 'admin')) {
            // Super admin can see all projects
            const [projects] = await sequelize.query(
                `SELECT * FROM ext_lab_projects ORDER BY created_at DESC`
            );
            return projects;
        }

        // Regular users see only their projects
        const [projects] = await sequelize.query(
            `SELECT p.*, pm.role as user_role
             FROM ext_lab_projects p
             INNER JOIN project_members pm ON p.id = pm.project_id
             WHERE pm.user_id = $1
             ORDER BY p.created_at DESC`,
            { bind: [userId] }
        );

        return projects;

    } catch (error) {
        console.error('Get accessible projects error:', error);
        throw error;
    }
};

/**
 * Filter experiments/tasks by project access
 */
const filterByProjectAccess = async (userId, tableName) => {
    try {
        // Check if user is super admin
        const [users] = await sequelize.query(
            `SELECT role, username FROM "Users" WHERE id = $1`,
            { bind: [userId] }
        );

        if (users.length > 0 && (users[0].role === 'SuperAdmin' || users[0].username === 'admin')) {
            // Super admin can see all
            return null; // No filter needed
        }

        // Get user's accessible project IDs
        const [projectIds] = await sequelize.query(
            `SELECT project_id FROM project_members WHERE user_id = $1`,
            { bind: [userId] }
        );

        const ids = projectIds.map(p => p.project_id);

        if (ids.length === 0) {
            return []; // User has no project access
        }

        return ids;

    } catch (error) {
        console.error('Filter by project access error:', error);
        throw error;
    }
};

module.exports = {
    checkProjectAccess,
    getAccessibleProjects,
    filterByProjectAccess
};
