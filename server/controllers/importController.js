const { sequelize } = require('../models');
const { Sequelize } = require('sequelize');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Supported tables for CSV import
const SUPPORTED_TABLES = {
    'ext_bacterial_strains': {
        requiredColumns: ['species', 'strain_number'],
        optionalColumns: ['source', 'characteristics', 'antibiotic_resistance', 'storage_location']
    },
    'ext_bacteriophages': {
        requiredColumns: ['phage_name', 'host_strain'],
        optionalColumns: ['morphology', 'genome_size', 'titer', 'storage_location']
    },
    'ext_plasmids': {
        requiredColumns: ['plasmid_name'],
        optionalColumns: ['size_kb', 'resistance_marker', 'copy_number', 'source']
    },
    'ext_primers_details': {
        requiredColumns: ['primer_name', 'sequence'],
        optionalColumns: ['tm', 'gc_content', 'purpose', 'storage_location']
    },
    'ext_antibiotics': {
        requiredColumns: ['name'],
        optionalColumns: ['concentration', 'stock_solution', 'storage_temp', 'expiry_date']
    },
    'ext_lab_stock': {
        requiredColumns: ['item_name', 'category'],
        optionalColumns: ['quantity', 'unit', 'supplier', 'catalog_number', 'location']
    }
};

/**
 * Preview CSV file and validate structure
 */
exports.previewImport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { tableName } = req.body;

        if (!SUPPORTED_TABLES[tableName]) {
            return res.status(400).json({ error: `Table ${tableName} is not supported for import` });
        }

        const filePath = req.file.path;
        const rows = [];
        const errors = [];
        let lineNumber = 0;

        // Parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    lineNumber++;

                    // Validate row
                    const rowErrors = validateRow(row, tableName, lineNumber);
                    if (rowErrors.length > 0) {
                        errors.push(...rowErrors);
                    }

                    rows.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Clean up uploaded file after preview
        fs.unlinkSync(filePath);

        const tableConfig = SUPPORTED_TABLES[tableName];
        const preview = rows.slice(0, 10); // Show first 10 rows

        res.json({
            success: true,
            tableName,
            totalRows: rows.length,
            preview,
            errors: errors.slice(0, 50), // Limit errors shown
            hasErrors: errors.length > 0,
            requiredColumns: tableConfig.requiredColumns,
            optionalColumns: tableConfig.optionalColumns
        });

    } catch (error) {
        console.error('Preview import error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Execute CSV import
 */
exports.executeImport = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { tableName } = req.body;
        const userId = req.user?.id;

        if (!SUPPORTED_TABLES[tableName]) {
            return res.status(400).json({ error: `Table ${tableName} is not supported for import` });
        }

        // Create import log entry
        const [logResult] = await sequelize.query(
            `INSERT INTO import_logs (user_id, table_name, file_name, status) 
             VALUES ($1, $2, $3, 'processing') RETURNING id`,
            { bind: [userId, tableName, req.file.originalname], transaction }
        );
        const logId = logResult[0].id;

        const filePath = req.file.path;
        const rows = [];
        const errors = [];
        let lineNumber = 0;

        // Parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    lineNumber++;
                    const rowErrors = validateRow(row, tableName, lineNumber);
                    if (rowErrors.length > 0) {
                        errors.push(...rowErrors);
                    } else {
                        rows.push(row);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // If validation errors, rollback
        if (errors.length > 0) {
            await sequelize.query(
                `UPDATE import_logs SET status = 'failed', error_details = $1, completed_at = NOW() WHERE id = $2`,
                { bind: [JSON.stringify(errors), logId], transaction }
            );
            await transaction.commit();
            fs.unlinkSync(filePath);
            return res.status(400).json({ success: false, errors });
        }

        // Insert rows
        let successCount = 0;
        const insertErrors = [];

        for (let i = 0; i < rows.length; i++) {
            try {
                await insertRow(tableName, rows[i], transaction);
                successCount++;
            } catch (err) {
                insertErrors.push({
                    line: i + 2, // +2 because CSV has header and is 1-indexed
                    error: err.message,
                    data: rows[i]
                });
            }
        }

        // Update import log
        await sequelize.query(
            `UPDATE import_logs 
             SET total_rows = $1, successful_rows = $2, failed_rows = $3, 
                 error_details = $4, status = $5, completed_at = NOW() 
             WHERE id = $6`,
            {
                bind: [
                    rows.length,
                    successCount,
                    insertErrors.length,
                    JSON.stringify(insertErrors),
                    insertErrors.length > 0 ? 'completed' : 'completed',
                    logId
                ],
                transaction
            }
        );

        await transaction.commit();
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            totalRows: rows.length,
            successfulRows: successCount,
            failedRows: insertErrors.length,
            errors: insertErrors
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Execute import error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get import history
 */
exports.getImportHistory = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const [logs] = await sequelize.query(
            `SELECT il.*, u.username 
             FROM import_logs il 
             LEFT JOIN "Users" u ON il.user_id = u.id 
             ORDER BY il.created_at DESC 
             LIMIT $1 OFFSET $2`,
            { bind: [parseInt(limit), parseInt(offset)] }
        );

        const [countResult] = await sequelize.query(
            `SELECT COUNT(*) as total FROM import_logs`
        );

        res.json({
            logs,
            total: parseInt(countResult[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Get import history error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Download CSV template for a table
 */
exports.downloadTemplate = async (req, res) => {
    try {
        const { tableName } = req.params;

        if (!SUPPORTED_TABLES[tableName]) {
            return res.status(400).json({ error: `Table ${tableName} is not supported` });
        }

        const config = SUPPORTED_TABLES[tableName];
        const headers = [...config.requiredColumns, ...config.optionalColumns];

        // Create CSV content
        const csvContent = headers.join(',') + '\n';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${tableName}_template.csv"`);
        res.send(csvContent);

    } catch (error) {
        console.error('Download template error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Validate a single row
 */
function validateRow(row, tableName, lineNumber) {
    const errors = [];
    const config = SUPPORTED_TABLES[tableName];

    // Check required columns
    for (const col of config.requiredColumns) {
        if (!row[col] || row[col].trim() === '') {
            errors.push({
                line: lineNumber,
                column: col,
                error: `Required column '${col}' is missing or empty`
            });
        }
    }

    return errors;
}

/**
 * Insert a single row into the database
 */
async function insertRow(tableName, row, transaction) {
    // Clean the row data (remove empty strings, trim values)
    const cleanedRow = {};
    for (const [key, value] of Object.entries(row)) {
        if (value && value.trim() !== '') {
            cleanedRow[key] = value.trim();
        }
    }

    // Add timestamps if table supports them
    const now = new Date();
    if (tableName !== 'ext_primers_details') {
        cleanedRow.created_at = now;
        cleanedRow.updated_at = now;
    }

    const columns = Object.keys(cleanedRow).map(k => `"${k}"`).join(', ');
    const placeholders = Object.keys(cleanedRow).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(cleanedRow);

    const query = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`;

    await sequelize.query(query, { bind: values, transaction });
}

module.exports = exports;
