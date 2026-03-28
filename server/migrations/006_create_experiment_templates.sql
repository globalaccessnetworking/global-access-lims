-- Migration: Create experiment_templates table
-- Date: 2026-02-16
-- Feature: Experiment Templates

CREATE TABLE IF NOT EXISTS experiment_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    protocol VARCHAR(100),
    description TEXT,
    default_fields JSONB,
    checklist JSONB,
    created_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_protocol ON experiment_templates(protocol);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON experiment_templates(created_by);

COMMENT ON TABLE experiment_templates IS 'Reusable experiment templates for consistency';
