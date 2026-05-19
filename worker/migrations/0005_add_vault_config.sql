-- Migration 0005: Vault configuration — D controls label, color, visibility, copy per vault.
-- Apply: wrangler d1 execute psc-tracks --remote --file=migrations/0005_add_vault_config.sql

CREATE TABLE IF NOT EXISTS vault_config (
  vault_id   TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  color      TEXT,                              -- hex color or NULL for achromatic
  visibility INTEGER NOT NULL DEFAULT 1,        -- 1=visible in listener dock, 0=hidden
  copy       TEXT,                              -- subtitle shown in listener shell
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default vault rows — D can override via console
INSERT OR IGNORE INTO vault_config (vault_id, label, color, visibility, copy, sort_order) VALUES
  ('venus',   'MIXES',          '#14dc14', 1, 'EXTENDED SETS · FULL SEQUENCES · NO INTERRUPTIONS',       0),
  ('saturn',  'ORIGINAL MUSIC', NULL,      1, 'STUDIO RECORDINGS · STEMS · UNRELEASED CUTS',             1),
  ('mercury', 'LIVE SETS',      '#cc2200', 1, 'RAW FROM THE ROOM · CAPTURED · MASTERED FOR THE ARCHIVE', 2);
