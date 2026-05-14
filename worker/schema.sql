-- D1 database schema for PSC tracks
-- NOTE: live DB already has all columns; this file is documentation only.
-- Never run this against the live DB — use ALTER TABLE for migrations.
CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vault TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  bpm REAL,
  bpm_display TEXT,
  musical_key TEXT,
  frequency_hz INTEGER,
  audio_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  waveform_data TEXT,
  duration REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  hot_cues TEXT,
  is_voided INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0
);

CREATE INDEX idx_vault ON tracks(vault);
CREATE INDEX idx_voided ON tracks(is_voided);
CREATE INDEX idx_created ON tracks(created_at);
