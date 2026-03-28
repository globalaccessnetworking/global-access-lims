const db = require('../models');
const { Sequelize } = require('sequelize');

// Core modules configuration remains the same
const CORE_MODULES = [
    { name: 'Phage Library', type: 'BiologicalAsset', isCore: true, icon: 'Bug', path: '/repository/phages' },
    { name: 'Host Strains', type: 'BiologicalAsset', isCore: true, icon: 'Disc', path: '/repository/strains' },
    { name: 'Plasmids', type: 'BiologicalAsset', isCore: true, icon: 'Zap', path: '/repository/plasmids' },
    { name: 'Primers', type: 'BiologicalAsset', isCore: true, icon: 'Activity', path: '/repository/primers' },
    { name: 'Inventory Hub', type: 'InventoryStock', isCore: true, icon: 'Package', path: '/inventory/hub' }
];

exports.getModuleList = async (req, res) => {
    try {
        // Fetch ALL tables in public schema to avoid LIKE issues
        const results = await db.sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
            { type: Sequelize.QueryTypes.SELECT }
        );

        const dynamicModules = results
            .map(row => {
                let tableName;
                if (Array.isArray(row)) tableName = row[0];
                else if (typeof row === 'object' && row.table_name) tableName = row.table_name;
                else if (typeof row === 'string') tableName = row;

                if (!tableName || !tableName.startsWith('ext_')) return null;

                // distinct name generation: ext_bacteriophages -> Bacteriophages
                const rawName = tableName.replace('ext_', '').replace(/_/g, ' ');
                const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

                return {
                    name: displayName,
                    type: tableName, // e.g. "ext_bacteriophages"
                    isCore: false,
                    icon: 'FileText',
                    path: `/dynamic/${tableName}`
                };
            })
            .filter(m => m !== null);

        res.json({
            core: CORE_MODULES,
            dynamic: dynamicModules
        });
    } catch (err) {
        console.error('Error fetching module list:', err);
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
};

exports.getModuleData = async (req, res) => {
    const { type } = req.params;

    try {
        let data, count, schema;

        // Security check: must start with ext_ to prevent SQL injection or accessing system tables
        if (!type.startsWith('ext_')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Validate table existence (optional but good practice)
        // For now, we rely on the prefix check and error handling

        // Fetch data using raw query
        // We use replacement for the table name strictly after validation, 
        // OR better: use sequelize.query with specific table escaping if possible.
        // Since table names come from our own trusted API list (filtered by prefix), strict validation is key.

        // Prevent path traversal characters just in case
        if (/[^a-z0-9_]/.test(type)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        const rows = await db.sequelize.query(`SELECT * FROM "${type}"`, {
            type: Sequelize.QueryTypes.SELECT
        });

        count = rows.length;
        data = rows;

        // Dynamic Schema Generation from first row
        if (data.length > 0) {
            const firstItem = data[0].toJSON ? data[0].toJSON() : data[0];
            schema = Object.keys(firstItem).filter(k =>
                !['createdAt', 'updatedAt', 'data', 'search_text', 'storage_location_id', 'source_id', 'id'].includes(k)
            ).map(k => ({
                key: k,
                label: k.replace(/_/g, ' ').toUpperCase()
            }));

            // Re-add ID at the start
            schema.unshift({ key: 'id', label: 'ID' });
        }

        res.json({ type, count: data.length, schema, data });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
