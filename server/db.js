const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'spending.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY,
    google_id  TEXT UNIQUE NOT NULL,
    email      TEXT NOT NULL,
    name       TEXT,
    avatar_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    date        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category    TEXT,
    amount      REAL NOT NULL,
    source      TEXT NOT NULL DEFAULT 'csv'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id           INTEGER PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    name         TEXT NOT NULL,
    month        TEXT NOT NULL,
    is_recurring INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, name, month)
  );

  CREATE TABLE IF NOT EXISTS classification_rules (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    pattern    TEXT NOT NULL,
    category   TEXT NOT NULL,
    hit_count  INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, pattern)
  );
`);

module.exports = db;
