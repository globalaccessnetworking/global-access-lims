const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const attachmentController = require('../controllers/attachmentController');
const { auth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/attachments/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'attachment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Allow images and common document types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});

// @route   POST /api/attachments/upload
// @desc    Upload attachment
// @access  Private
router.post('/upload', auth, upload.single('file'), attachmentController.uploadAttachment);

// @route   GET /api/attachments/:entityType/:entityId
// @desc    Get all attachments for an entity
// @access  Private
router.get('/:entityType/:entityId', auth, attachmentController.getAttachments);

// @route   DELETE /api/attachments/:id
// @desc    Delete attachment
// @access  Private
router.delete('/:id', auth, attachmentController.deleteAttachment);

// @route   PUT /api/attachments/:id/caption
// @desc    Update attachment caption
// @access  Private
router.put('/:id/caption', auth, attachmentController.updateCaption);

module.exports = router;
