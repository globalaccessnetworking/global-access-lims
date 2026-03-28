-- Migration: Create attachments table for photo/file uploads
-- Date: 2026-02-16
-- Feature: Photo Attachments

CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'experiment', 'strain', 'phage', 'plasmid', etc.
    entity_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image/jpeg', 'image/png', etc.
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_created ON attachments(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE attachments IS 'Stores file attachments (images, documents) linked to various entities';
