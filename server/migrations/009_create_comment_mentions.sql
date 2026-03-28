-- Migration: Create comment_mentions table
-- Date: 2026-02-16
-- Feature: @Mentions in Comments

CREATE TABLE IF NOT EXISTS comment_mentions (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES ext_experiment_comments(id) ON DELETE CASCADE,
    mentioned_user_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(comment_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentions_user ON comment_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_comment ON comment_mentions(comment_id);

COMMENT ON TABLE comment_mentions IS '@mention notifications for team collaboration';
