-- Migration: 003_add_missing_columns_to_trips
-- Adds created_at and user_id columns to trips table if not already present

ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
