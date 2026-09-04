-- Migration: 004_add_summary_to_trips
-- Adds a short one-line summary field to the trips table

ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS summary TEXT;
