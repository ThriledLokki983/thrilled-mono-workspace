-- Migration: Add user preferences
-- Date: 2024-01-16 10:30:00
-- Author: Database Package

-- UP
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    UNIQUE(user_id, preference_key)
);

-- Create index for faster user preference lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);

-- Add some default preferences
INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT id, 'theme', 'light' FROM users WHERE id NOT IN (
    SELECT user_id FROM user_preferences WHERE preference_key = 'theme'
);

INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT id, 'notifications', 'true' FROM users WHERE id NOT IN (
    SELECT user_id FROM user_preferences WHERE preference_key = 'notifications'
);

-- DOWN
DROP INDEX IF EXISTS idx_user_preferences_key;
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP TABLE IF EXISTS user_preferences;
