-- Track waveform generation success/failure for each track.
-- waveform_generated_at: ISO-8601 timestamp when V2 binary was successfully written to R2.
-- waveform_error: error message string from the last failed generation attempt.
ALTER TABLE tracks ADD COLUMN waveform_generated_at TEXT;
ALTER TABLE tracks ADD COLUMN waveform_error TEXT;
