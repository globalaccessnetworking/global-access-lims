const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const ExcelJS = require('exceljs');
const QRCode = require('qrcode');

// POST /api/batch/delete
exports.bulkDelete = async (req, res) => {
    try {
        const { entityType, ids } = req.body;

        if (!ids || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }

        let tableName;
        switch (entityType) {
            case 'experiment':
                tableName = 'Experiments';
                break;
            case 'strain':
                tableName = 'ext_bacterial_strains';
                break;
            case 'phage':
                tableName = 'ext_bacteriophages';
                break;
            case 'chemical':
                tableName = 'Chemicals';
                break;
            case 'task':
                tableName = 'ext_lab_tasks';
                break;
            default:
                return res.status(400).json({ error: 'Invalid entity type' });
        }

        const placeholders = ids.map((_, i) => `:id${i}`).join(',');
        const replacements = {};
        ids.forEach((id, i) => {
            replacements[`id${i}`] = id;
        });

        await sequelize.query(`
            DELETE FROM "${tableName}"
            WHERE id IN (${placeholders})
        `, { replacements, type: QueryTypes.DELETE });

        res.json({ success: true, deleted: ids.length });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: 'Failed to delete items' });
    }
};

// POST /api/batch/export
exports.bulkExport = async (req, res) => {
    try {
        const { entityType, ids } = req.body;

        let query, tableName;
        switch (entityType) {
            case 'experiment':
                query = `SELECT * FROM "Experiments" WHERE id = ANY(:ids)`;
                tableName = 'Experiments';
                break;
            case 'strain':
                query = `SELECT * FROM "ext_bacterial_strains" WHERE id = ANY(:ids)`;
                tableName = 'Bacterial_Strains';
                break;
            case 'phage':
                query = `SELECT * FROM "ext_bacteriophages" WHERE id = ANY(:ids)`;
                tableName = 'Bacteriophages';
                break;
            case 'chemical':
                query = `SELECT * FROM "Chemicals" WHERE id = ANY(:ids)`;
                tableName = 'Chemicals';
                break;
            default:
                return res.status(400).json({ error: 'Invalid entity type' });
        }

        const data = await sequelize.query(query, {
            replacements: { ids },
            type: QueryTypes.SELECT
        });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(tableName);

        if (data.length > 0) {
            // Add headers
            const headers = Object.keys(data[0]);
            worksheet.addRow(headers);

            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF10b981' }
            };

            // Add data rows
            data.forEach(row => {
                worksheet.addRow(Object.values(row));
            });

            // Auto-fit columns
            worksheet.columns.forEach(column => {
                column.width = 15;
            });
        }

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${tableName}_export_${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Bulk export error:', error);
        res.status(500).json({ error: 'Failed to export items' });
    }
};

// POST /api/batch/update-status
exports.bulkUpdateStatus = async (req, res) => {
    try {
        const { entityType, ids, status } = req.body;

        let tableName;
        switch (entityType) {
            case 'task':
                tableName = 'ext_lab_tasks';
                break;
            case 'project':
                tableName = 'ext_lab_projects';
                break;
            case 'experiment':
                tableName = 'Experiments';
                break;
            default:
                return res.status(400).json({ error: 'Invalid entity type' });
        }

        const placeholders = ids.map((_, i) => `:id${i}`).join(',');
        const replacements = { status };
        ids.forEach((id, i) => {
            replacements[`id${i}`] = id;
        });

        await sequelize.query(`
            UPDATE "${tableName}"
            SET status = :status, updated_at = NOW()
            WHERE id IN (${placeholders})
        `, { replacements, type: QueryTypes.UPDATE });

        res.json({ success: true, updated: ids.length });
    } catch (error) {
        console.error('Bulk update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// POST /api/batch/generate-qr
exports.bulkGenerateQR = async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, name, type }

        const qrCodes = await Promise.all(
            items.map(async (item) => {
                const qrData = JSON.stringify({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    url: `${process.env.APP_URL || 'http://localhost:5174'}/view/${item.type}/${item.id}`
                });

                const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                return {
                    id: item.id,
                    name: item.name,
                    qrCode: qrCodeDataURL
                };
            })
        );

        res.json({ qrCodes });
    } catch (error) {
        console.error('Bulk QR generation error:', error);
        res.status(500).json({ error: 'Failed to generate QR codes' });
    }
};
