-- Migration: 002_add_user_id_to_trips
-- Adds user_id foreign key column to the trips table

ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;