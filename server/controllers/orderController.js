const { PurchaseOrder, Chemical, AuditLog } = require('../models');
const PDFDocument = require('pdfkit');
const { sendPurchaseOrder } = require('../utils/mailer');

exports.getOrders = async (req, res) => {
    try {
        const orders = await PurchaseOrder.findAll({
            include: [{ model: Chemical }]
        });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createOrder = async (req, res) => {
    const { chemical_id, quantity } = req.body;

    try {
        const order = await PurchaseOrder.create({
            chemical_id,
            quantity,
            status: 'Pending'
        });

        // Audit Log
        await AuditLog.create({
            user_id: req.user.id,
            action: 'CREATE_ORDER',
            description: `Created PO for chemical ID ${chemical_id}, Qty: ${quantity}`
        });

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.generatePurchaseRequestPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const chemical = await Chemical.findByPk(id);

        if (!chemical) {
            return res.status(404).json({ message: 'Chemical not found' });
        }

        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        // Settings for PDF
        const filename = `Purchase_Request_${chemical.item_name || chemical.name}_${Date.now()}.pdf`;

        // Wrap the PDF generation logic to handle stream completion
        const pdfPromise = new Promise((resolve) => {
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
        });

        // Header
        doc.fontSize(20).text('OFFICIAL PURCHASE REQUEST', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text('University of the Punjab - Phage Lab', { align: 'center' });
        doc.fontSize(10).text('Procurement & Inventory Management System', { align: 'center', color: '#666666' });
        doc.moveDown(2);

        // Horizontal Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Details Table-like structure
        const drawRow = (label, value) => {
            doc.fontSize(10).fillColor('#444444').text(label, { continued: true });
            doc.fillColor('#000000').text(` : ${value}`);
            doc.moveDown();
        };

        drawRow('Request Date', new Date().toLocaleString());
        drawRow('Chemical Name', chemical.item_name || chemical.name);
        drawRow('Catalog/QR ID', chemical.qr_identity_string || chemical.barcode || 'N/A');
        drawRow('Current Balance', `${chemical.current_volume} ${chemical.unit_type || chemical.unit || ''}`);
        drawRow('Alert Level', `${chemical.stock_alert_level} ${chemical.unit_type || chemical.unit || ''}`);

        doc.moveDown(2);
        doc.fontSize(12).text('Procurement Status: URGENT / CRITICAL LOW STOCK', { color: 'red' });

        doc.moveDown(4);
        doc.fontSize(10).fillColor('#666666').text('Authorized Lab Signature:', { continued: true });
        doc.text(' ___________________________', { color: '#000000' });

        doc.moveDown();
        doc.fontSize(8).text('Generated via Bacteriophage LIMS Asset Tracking Module.', { align: 'bottom' });

        doc.end();

        const pdfData = await pdfPromise;

        // Send Email
        const supplierEmail = chemical.supplier_email || 'admin@globalaccess.com';
        const subject = `Purchase Request: ${chemical.item_name || chemical.name} - URGENT`;
        const text = `Please find the attached purchase request for ${chemical.item_name || chemical.name}.\n\nCurrent Balance: ${chemical.current_volume}${chemical.unit_type || chemical.unit}.\n\nThis is an automated request from the Phage Lab Inventory System.`;

        await sendPurchaseOrder(supplierEmail, subject, text, {
            filename: filename,
            content: pdfData
        });

        // Respond with PDF for local download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(pdfData);

    } catch (err) {
        console.error("PDF/Email Generation Error:", err.message);
        res.status(500).json({ error: 'Failed to process request', details: err.message });
    }
};
