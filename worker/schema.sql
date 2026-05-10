-- D1 database schema for PSC tracks
CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vault TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  bpm REAL,
  frequency_hz INTEGER,
  audio_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_voided INTEGER DEFAULT 0
);

CREATE INDEX idx_vault ON tracks(vault);
CREATE INDEX idx_voided ON tracks(is_voided);
CREATE INDEX idx_created ON tracks(created_at);
