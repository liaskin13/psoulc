-- Migration 0001: Add duration, musical_key, hot_cues to tracks table
-- Apply with: wrangler d1 execute psc-tracks --file=migrations/0001_add_duration_key_hotcues.sql

ALTER TABLE tracks ADD COLUMN duration REAL;
ALTER TABLE tracks ADD COLUMN musical_key TEXT;
ALTER TABLE tracks ADD COLUMN hot_cues TEXT;
