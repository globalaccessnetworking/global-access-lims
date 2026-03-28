-- Migration: Create project_members table for access control
-- Date: 2026-02-16
-- Feature: Project-Based Access Control

CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES ext_lab_projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'member', 'viewer'
    added_at TIMESTAMP DEFAULT NOW(),
    added_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    UNIQUE(project_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Add comment for documentation
COMMENT ON TABLE project_members IS 'Manages project membership and role-based access control';

-- Add project_id to Experiments table if not exists (for linking experiments to projects)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Experiments' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE "Experiments" ADD COLUMN project_id INTEGER REFERENCES ext_lab_projects(id) ON DELETE SET NULL;
        CREATE INDEX idx_experiments_project ON "Experiments"(project_id);
    END IF;
END $$;

-- Add project_id to ext_lab_tasks if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ext_lab_tasks' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE ext_lab_tasks ADD COLUMN project_id INTEGER REFERENCES ext_lab_projects(id) ON DELETE SET NULL;
        CREATE INDEX idx_lab_tasks_project ON ext_lab_tasks(project_id);
    END IF;
END $$;
