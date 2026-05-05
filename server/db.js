const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Creates all tables if they don't already exist.
async function initDb() {
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY,
        google_id  TEXT UNIQUE NOT NULL,
        email      TEXT NOT NULL,
        name       TEXT,
        avatar_url TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS transactions (
        id          INTEGER PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id),
        date        TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category    TEXT,
        amount      REAL NOT NULL,
        source      TEXT NOT NULL DEFAULT 'csv'
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS categories (
        id           INTEGER PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id),
        name         TEXT NOT NULL,
        month        TEXT NOT NULL,
        is_recurring INTEGER NOT NULL DEFAULT 1,
        created_at   TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, name, month)
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS classification_rules (
        id         INTEGER PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        pattern    TEXT NOT NULL,
        category   TEXT NOT NULL,
        hit_count  INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, pattern)
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS gemini_usage (
        date        TEXT PRIMARY KEY,
        tokens_used INTEGER NOT NULL DEFAULT 0
      )`,
      args: [],
    },
  ], 'write');
}

module.exports = { db, initDb };
