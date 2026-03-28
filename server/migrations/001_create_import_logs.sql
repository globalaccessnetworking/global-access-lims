-- Migration: Create import_logs table for CSV import tracking
-- Date: 2026-02-16
-- Feature: Bulk CSV Import

CREATE TABLE IF NOT EXISTS import_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    error_details JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_import_logs_user ON import_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_created ON import_logs(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE import_logs IS 'Tracks all CSV import operations with success/failure details';
