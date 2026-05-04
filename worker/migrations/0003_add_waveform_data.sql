-- Migration 0003: Add waveform_data to tracks table
-- Apply with: wrangler d1 execute psc-tracks --file=migrations/0003_add_waveform_data.sql

ALTER TABLE tracks ADD COLUMN waveform_data TEXT;
