-- Migration: Add experiment outcome tracking
-- Date: 2026-02-16
-- Feature: Experiment Success Rate Tracking

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Experiments' AND column_name = 'outcome'
    ) THEN
        ALTER TABLE "Experiments" ADD COLUMN outcome VARCHAR(50);
        ALTER TABLE "Experiments" ADD COLUMN outcome_notes TEXT;
        ALTER TABLE "Experiments" ADD COLUMN completed_at TIMESTAMP;
        
        CREATE INDEX idx_experiments_outcome ON "Experiments"(outcome);
    END IF;
END $$;

COMMENT ON COLUMN "Experiments".outcome IS 'Experiment outcome: success, partial, failed, pending';
