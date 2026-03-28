const express = require('express');
const router = express.Router();
const { sequelize, Notification } = require('../models');
const { Sequelize } = require('sequelize');

// @route   GET api/system/tables
// @desc    Get all dynamic tables (starting with ext_)
// @access  Public (or Protected)
router.get('/tables', async (req, res) => {
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name LIKE 'ext_%';
        `;

        const results = await sequelize.query(query, {
            type: Sequelize.QueryTypes.SELECT
        });

        // Map to cleaner format
        const tables = results.map(row => {
            const rawName = Array.isArray(row) ? row[0] : row.table_name;
            if (!rawName) return null; // Safety check
            const displayName = rawName.replace('ext_', '').replace(/_/g, ' ');
            return {
                name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
                tableName: rawName,
                path: `/dynamic/${rawName}`
            };
        });

        res.json(tables);
    } catch (err) {
        console.error('Error fetching tables:', err);
        res.status(500).json({ error: 'Failed to fetch system tables' });
    }
});

// Helper to get foreign keys for a table (Postgres-specific for reliability)
async function getForeignKeys(tableName) {
    const query = `
        SELECT
            a.attname AS column_name,
            confrelid::regclass::text AS foreign_table_name,
            af.attname AS foreign_column_name
        FROM pg_constraint AS c
        JOIN pg_attribute AS a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        JOIN pg_attribute AS af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
        WHERE c.contype = 'f' AND conrelid = $1::regclass;
    `;
    try {
        const rows = await sequelize.query(query, { bind: [tableName], type: Sequelize.QueryTypes.SELECT });
        return rows || [];
    } catch (err) {
        console.warn(`[SYSTEM] FK detection failed for ${tableName}:`, err.message);
        return [];
    }
}

// Helper to fetch options for a foreign key with human-readable labels
async function getForeignKeyOptions(foreignTable, foreignCol) {
    try {
        // Try to find a human-readable column
        // Standardize table name for information_schema (remove quotes if any)
        const cleanTable = foreignTable.replace(/"/g, '');

        const cols = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
        `, { bind: [cleanTable], type: Sequelize.QueryTypes.SELECT });

        const colNames = cols.map(c => c.column_name.toLowerCase());
        let labelCol = foreignCol;

        const candidates = ['name', 'full_name', 'title', 'username', 'display_name', 'email', 'description', 'label'];
        for (const cand of candidates) {
            if (colNames.includes(cand)) {
                labelCol = cand;
                break;
            }
        }

        // Use the native table name for the actual query (case-preserving)
        const query = `SELECT "${foreignCol}" as value, "${labelCol}" as label FROM "${cleanTable}" LIMIT 200`;
        const options = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
        return options;
    } catch (err) {
        console.warn(`[SYSTEM] Failed to fetch options for ${foreignTable}:`, err.message);
        return [];
    }
}

// Hardcoded schema overrides for common tables to ensure enums work even if metadata fails
const SCHEMA_OVERRIDES = {
    'ext_lab_tasks': {
        'status': { type: 'select', options: ['Pending', 'Todo', 'In Progress', 'Review', 'Completed'] },
        'priority': { type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
    },
    'ext_lab_projects': {
        'status': { type: 'select', options: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'] }
    },
    'ext_equipment_logs': {
        'status': { type: 'select', options: ['Operational', 'Maintenance Due', 'Out of Order'] }
    },
    'ext_experiment_comments': {
        'category': { type: 'select', options: ['General', 'Issue', 'Observation', 'Protocol Update'] }
    }
};

// @route   GET api/system/:tableName/schema
// @desc    Get ONLY schema for a specific dynamic table
router.get('/:tableName/schema', async (req, res) => {
    const { tableName } = req.params;
    if (!tableName.startsWith('ext_')) return res.status(403).json({ error: 'Access denied.' });
    if (/[^a-z0-9_]/.test(tableName)) return res.status(400).json({ error: 'Invalid table name.' });

    try {
        const [description, fks] = await Promise.all([
            sequelize.getQueryInterface().describeTable(tableName).catch(() => ({})),
            getForeignKeys(tableName).catch(() => [])
        ]);

        let schema = [];
        if (description && Object.keys(description).length > 0) {
            schema = await Promise.all(Object.keys(description).map(async (key) => {
                const col = description[key];
                let item = {
                    key,
                    label: key.replace(/_/g, ' ').toUpperCase(),
                    type: (col.type || '').toString().toLowerCase().includes('int') ? 'number' : 'text'
                };

                const fk = fks.find(f => f.column_name === key);
                if (fk) {
                    item.type = 'select';
                    item.options = await getForeignKeyOptions(fk.foreign_table_name, fk.foreign_column_name);
                } else if (SCHEMA_OVERRIDES[tableName] && SCHEMA_OVERRIDES[tableName][key]) {
                    item = { ...item, ...SCHEMA_OVERRIDES[tableName][key] };
                    if (item.type === 'select' && item.options?.length > 0 && typeof item.options[0] === 'string') {
                        item.options = item.options.map(opt => ({ value: opt, label: opt }));
                    }
                }
                return item;
            }));
        }

        res.json({ tableName, schema });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET api/system/:tableName
// @desc    Get data for a specific dynamic table
// @access  Public (or Protected)
router.get('/:tableName', async (req, res) => {
    const { tableName } = req.params;

    // Security: Enforce prefix
    if (!tableName.startsWith('ext_')) {
        return res.status(403).json({ error: 'Access denied. Invalid table scope.' });
    }

    // Security: Alphanumeric check
    if (/[^a-z0-9_]/.test(tableName)) {
        return res.status(400).json({ error: 'Invalid table name parameter.' });
    }

    try {
        console.log(`[SYSTEM] Fetching data/schema for table: ${tableName}`);

        // 1. Fetch data and initial metadata in parallel
        const [rows, description, fks] = await Promise.all([
            sequelize.query(`SELECT * FROM "${tableName}" LIMIT 2000`, { type: Sequelize.QueryTypes.SELECT }),
            sequelize.getQueryInterface().describeTable(tableName).catch(e => { console.warn(`[SYSTEM] describeTable failed:`, e.message); return {}; }),
            getForeignKeys(tableName).catch(e => { console.warn(`[SYSTEM] getForeignKeys failed:`, e.message); return []; })
        ]);

        // Robust Schema detection - Triple Fallback
        let schema = [];
        let method = 'none';
        let errors = {};

        try {
            // Attempt 1: describeTable
            if (description && Object.keys(description).length > 0) {
                console.log(`[SYSTEM] Using describeTable for ${tableName}`);

                // Process columns in parallel
                schema = await Promise.all(Object.keys(description).map(async (key) => {
                    const col = description[key];
                    let item = {
                        key: key,
                        label: key.replace(/_/g, ' ').toUpperCase(),
                        type: (col.type || '').toString().toLowerCase().includes('int') ? 'number' : 'text'
                    };

                    // 1. Check for Foreign Keys
                    const fk = fks.find(f => f.column_name === key);
                    if (fk) {
                        item.type = 'select';
                        item.options = await getForeignKeyOptions(fk.foreign_table_name, fk.foreign_column_name);
                    }
                    // 2. Dynamic Categories
                    else if (key.toLowerCase() === 'category' || key.toLowerCase() === 'entity_type') {
                        try {
                            const [tables] = await sequelize.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ext_%'`);
                            item.type = 'select';
                            item.options = tables.map(t => ({ value: t.table_name, label: t.table_name.replace('ext_', '').replace(/_/g, ' ') }));
                        } catch (eCat) { }
                    }

                    // 3. Apply Overrides
                    if (SCHEMA_OVERRIDES[tableName] && SCHEMA_OVERRIDES[tableName][key]) {
                        item = { ...item, ...SCHEMA_OVERRIDES[tableName][key] };
                        if (item.type === 'select' && item.options?.length > 0 && typeof item.options[0] === 'string') {
                            item.options = item.options.map(opt => ({ value: opt, label: opt }));
                        }
                    } else if (item.type !== 'select') {
                        if (col.special && Array.isArray(col.special) && col.special.length > 0) {
                            item.type = 'select';
                            item.options = col.special.map(opt => ({ value: opt, label: opt }));
                        } else {
                            const typeStr = (col.type || '').toString();
                            if (typeStr.includes('ENUM') || typeStr.startsWith('enum_')) {
                                item.type = 'select';
                                try {
                                    const enumName = typeStr.startsWith('enum_') ? typeStr : `enum_${tableName}_${key}`;
                                    const [enumRows] = await sequelize.query(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = '${enumName}' ORDER BY enumsortorder`);
                                    if (enumRows && enumRows.length > 0) {
                                        item.options = enumRows.map(r => ({ value: r.enumlabel, label: r.enumlabel }));
                                    }
                                } catch (e) { }
                            }
                        }
                    }
                    return item;
                }));
                method = 'describeTable';
            } else {
                errors.describeTable = 'Empty description returned';
            }
        } catch (e1) {
            console.warn(`[SYSTEM] describeTable processing failed for ${tableName}`);
            errors.describeTable = e1.message;
        }

        if (schema.length === 0) {
            try {
                // Attempt 2: information_schema
                console.log(`[SYSTEM] Attempting information_schema fallback for ${tableName}`);
                const [infoRows] = await sequelize.query(`
                    SELECT column_name, data_type, udt_name
                    FROM information_schema.columns 
                    WHERE table_name = '${tableName}' AND table_schema = 'public'
                    ORDER BY ordinal_position
                `);

                if (infoRows && infoRows.length > 0) {
                    schema = await Promise.all(infoRows.map(async (row) => {
                        const key = row.column_name;
                        const udt = row.udt_name;
                        let item = {
                            key: key,
                            label: key.replace(/_/g, ' ').toUpperCase(),
                            type: row.data_type.toLowerCase().includes('int') ? 'number' : 'text'
                        };

                        // 1. Foreign Key check
                        const fk = fks.find(f => f.column_name === key);
                        if (fk) {
                            item.type = 'select';
                            item.options = await getForeignKeyOptions(fk.foreign_table_name, fk.foreign_column_name);
                        }
                        // 2. Dynamic Categories
                        else if (key.toLowerCase() === 'category' || key.toLowerCase() === 'entity_type') {
                            try {
                                const [tables] = await sequelize.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ext_%'`);
                                item.type = 'select';
                                item.options = tables.map(t => ({ value: t.table_name, label: t.table_name.replace('ext_', '').replace(/_/g, ' ') }));
                            } catch (e) { }
                        }
                        // 3. Enum check
                        else if (udt && udt.startsWith('enum_')) {
                            try {
                                const [enumRows] = await sequelize.query(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = '${udt}' ORDER BY enumsortorder`);
                                if (enumRows && enumRows.length > 0) {
                                    item.type = 'select';
                                    item.options = enumRows.map(r => ({ value: r.enumlabel, label: r.enumlabel }));
                                }
                            } catch (e) { }
                        }
                        return item;
                    }));
                    method = 'information_schema';
                } else {
                    errors.information_schema = 'No columns found in information_schema';
                }
            } catch (e2) {
                console.warn(`[SYSTEM] information_schema fallback failed for ${tableName}`);
                errors.information_schema = e2.message;
            }
        }

        if (schema.length === 0) {
            try {
                // Attempt 3: LIMIT 0 query
                console.log(`[SYSTEM] Attempting LIMIT 0 query for ${tableName}`);
                const [results, metadata] = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 0`);
                const fields = metadata && metadata.fields ? metadata.fields : [];
                if (fields.length > 0) {
                    schema = fields.map(f => ({
                        key: f.name,
                        label: f.name.replace(/_/g, ' ').toUpperCase(),
                        type: 'text'
                    }));
                    method = 'limit0';
                } else {
                    errors.limit0 = 'No fields in metadata';
                }
            } catch (e3) {
                console.error(`[SYSTEM] LIMIT 0 failed for ${tableName}`);
                errors.limit0 = e3.message;
            }
        }

        console.log(`[SYSTEM] Found ${schema.length} columns for ${tableName} using ${method}`);

        res.json({
            tableName,
            count: rows.length,
            schema,
            data: rows,
            debug: {
                method,
                columnCount: schema.length,
                timestamp: new Date().toISOString(),
                version: 'v11_smart_dropdowns_enabled',
                errors
            }
        });

    } catch (err) {
        console.error(`Error fetching data for ${tableName}:`, err.message);
        if (err.parent && err.parent.code === '42P01') {
            return res.status(404).json({ error: 'Table not found' });
        }
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// @route   POST api/system/:tableName
// @desc    Add a record to a dynamic table
router.post('/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const data = req.body;

    if (!tableName.startsWith('ext_')) {
        return res.status(403).json({ error: 'Access denied.' });
    }

    try {
        // Fetch table description to check for timestamp columns
        const description = await sequelize.getQueryInterface().describeTable(tableName);
        const hasColumn = (colName) => Object.keys(description).includes(colName);

        const payload = { ...data };

        // [SECURE] Case Correction for Lab Tasks
        if (tableName === 'ext_lab_tasks' && payload.status) {
            const statusMap = {
                'pending': 'Pending',
                'todo': 'Todo',
                'todo ': 'Todo',
                'in progress': 'In Progress',
                'review': 'Review',
                'completed': 'Completed'
            };
            const lowerStatus = payload.status.toString().toLowerCase().trim();
            if (statusMap[lowerStatus]) {
                payload.status = statusMap[lowerStatus];
            }
        }

        const now = new Date();

        // Automatic Timestamps - ONLY if they exist in the schema
        if (hasColumn('created_at') && !payload.created_at) payload.created_at = now;
        if (hasColumn('updated_at') && !payload.updated_at) payload.updated_at = now;

        const columns = Object.keys(payload).join('", "');
        const values = Object.values(payload);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO "${tableName}" ("${columns}") VALUES (${placeholders}) RETURNING *`;

        const result = await sequelize.query(query, {
            bind: values,
            type: Sequelize.QueryTypes.INSERT
        });

        const record = result[0];

        // [NOTIFICATION] Trigger for Lab Tasks
        if (tableName === 'ext_lab_tasks' && record.assigned_to_id) {
            try {
                await Notification.create({
                    user_id: record.assigned_to_id,
                    type: 'TASK_ASSIGNED',
                    message: `New Task Assigned: ${record.title}`
                });
            } catch (errNotify) {
                console.error('Task Notification Error:', errNotify.message);
            }
        }

        res.json({ success: true, record });
    } catch (err) {
        console.error('Insert Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// @route   PUT api/system/:tableName/:id
router.put('/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const data = req.body;

    if (!tableName.startsWith('ext_')) return res.status(403).json({ error: 'Access denied.' });

    try {
        const description = await sequelize.getQueryInterface().describeTable(tableName);
        const hasColumn = (colName) => Object.keys(description).includes(colName);

        const payload = { ...data };

        // [SECURE] Case Correction for Lab Tasks
        if (tableName === 'ext_lab_tasks' && payload.status) {
            const statusMap = {
                'pending': 'Pending',
                'todo': 'Todo',
                'todo ': 'Todo',
                'in progress': 'In Progress',
                'review': 'Review',
                'completed': 'Completed'
            };
            const lowerStatus = payload.status.toString().toLowerCase().trim();
            if (statusMap[lowerStatus]) {
                payload.status = statusMap[lowerStatus];
            }
        }

        if (hasColumn('updated_at')) payload.updated_at = new Date();
        const updates = Object.keys(payload).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const values = Object.values(payload);

        const query = `UPDATE "${tableName}" SET ${updates} WHERE id = $${values.length + 1} RETURNING *`;

        const result = await sequelize.query(query, {
            bind: [...values, id],
            type: Sequelize.QueryTypes.UPDATE
        });

        const record = result[0];

        // [NOTIFICATION] Trigger for Lab Tasks (if assignment changed)
        if (tableName === 'ext_lab_tasks' && record.assigned_to_id && payload.assigned_to_id) {
            try {
                await Notification.create({
                    user_id: record.assigned_to_id,
                    type: 'TASK_UPDATED',
                    message: `Task Updated/Assigned: ${record.title}`
                });
            } catch (errNotify) {
                console.error('Task Update Notification Error:', errNotify.message);
            }
        }

        res.json({ success: true, record });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   DELETE api/system/:tableName/:id
router.delete('/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    if (!tableName.startsWith('ext_')) return res.status(403).json({ error: 'Access denied.' });

    try {
        await sequelize.query(`DELETE FROM "${tableName}" WHERE id = $1`, {
            bind: [id],
            type: Sequelize.QueryTypes.DELETE
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
