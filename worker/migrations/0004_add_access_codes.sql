-- Migration 0004: Access codes for sovereign listener access
-- A code grants access to all of D's published content.
-- Tier (MASTERS/MUSES/MEMBERS) controls future interaction rights, not content visibility.
-- Apply: wrangler d1 execute psc-tracks --remote --file=migrations/0004_add_access_codes.sql

CREATE TABLE IF NOT EXISTS access_codes (
  id TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'MEMBERS',
  granted_to TEXT,                         -- optional label: 'PUMP', 'JANET', etc.
  expires_at TEXT,                         -- ISO-8601 UTC; NULL = valid until revoked
  redeemed_at TEXT,                        -- first redemption timestamp (log only)
  redeemed_by TEXT,                        -- client UUID fingerprint
  revoked INTEGER NOT NULL DEFAULT 0,      -- D's kill switch
  created_by TEXT NOT NULL DEFAULT 'D',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_access_code_id ON access_codes(id);
