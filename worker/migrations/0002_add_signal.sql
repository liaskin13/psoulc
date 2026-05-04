-- Migration 0002: Add signal state and chat tables
-- Apply with: wrangler d1 execute psc-tracks --remote --file=migrations/0002_add_signal.sql

CREATE TABLE IF NOT EXISTS signal (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_live INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  started_at TEXT
);

-- Seed the single signal row so PUT can always UPDATE rather than INSERT
INSERT OR IGNORE INTO signal (id, is_live) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS signal_chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'G',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_created ON signal_chat(created_at);
