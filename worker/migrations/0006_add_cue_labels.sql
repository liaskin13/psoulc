-- Add cue_labels column to tracks table for D-bank editable hot cue names.
-- Apply via CF dashboard D1 console (token lacks D1 Edit permission).
ALTER TABLE tracks ADD COLUMN cue_labels TEXT DEFAULT NULL;
