// Database setup. Uses SQLite: a single file (data/canoepolo.db) — no separate database server needed.
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'canoepolo.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    slug                  TEXT NOT NULL UNIQUE,
    name                  TEXT NOT NULL,
    start_date            TEXT NOT NULL,          -- YYYY-MM-DD
    end_date              TEXT NOT NULL,          -- YYYY-MM-DD
    city                  TEXT NOT NULL,
    country               TEXT NOT NULL,          -- ISO code, e.g. IE, DE
    venue                 TEXT,
    level                 TEXT NOT NULL DEFAULT 'International',
    divisions             TEXT NOT NULL DEFAULT '', -- comma separated, e.g. "Men,Women,U21"
    description           TEXT,
    website_url           TEXT,
    registration_url      TEXT,
    registration_deadline TEXT,                    -- YYYY-MM-DD
    entry_fee             TEXT,
    contact_name          TEXT,
    contact_email         TEXT,
    status                TEXT NOT NULL DEFAULT 'published', -- published | draft | cancelled
    featured              INTEGER NOT NULL DEFAULT 0,
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tournaments_start ON tournaments(start_date);
  CREATE INDEX IF NOT EXISTS idx_tournaments_country ON tournaments(country);
`);

module.exports = db;
