-- Migration: Create activity_log table for tracking user actions
-- Date: 2026-02-16
-- Feature: Dashboard Activity Feed

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    entity_name VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity_type ON activity_log(entity_type);

-- Migration: Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);

-- Migration: Create alert_dismissals table
CREATE TABLE IF NOT EXISTS alert_dismissals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    alert_id VARCHAR(255) NOT NULL,
    snoozed_until TIMESTAMP,
    dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, alert_type, alert_id)
);

CREATE INDEX idx_alert_dismissals_user_id ON alert_dismissals(user_id);

-- Migration: Create saved_filters table
CREATE TABLE IF NOT EXISTS saved_filters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filter_type VARCHAR(50) NOT NULL,
    filter_criteria JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);
