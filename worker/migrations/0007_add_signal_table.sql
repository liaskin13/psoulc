-- Migration 0007: signal state table
-- Stores D's current broadcast signal (is_live flag + title).
-- Single-row table with id=1 enforced by CHECK constraint.
CREATE TABLE IF NOT EXISTS signal (
  id      INTEGER PRIMARY KEY CHECK (id = 1),
  is_live INTEGER NOT NULL DEFAULT 0,
  title   TEXT    DEFAULT NULL
);
INSERT OR IGNORE INTO signal (id, is_live) VALUES (1, 0);
