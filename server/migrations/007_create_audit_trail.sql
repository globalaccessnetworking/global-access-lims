-- Migration: Create enhanced audit_trail table
-- Date: 2026-02-16
-- Feature: Enhanced Audit Trail

CREATE TABLE IF NOT EXISTS audit_trail (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER,
    action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    user_id INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action);

COMMENT ON TABLE audit_trail IS 'Comprehensive audit trail for regulatory compliance';
