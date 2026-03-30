const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { classifyTransactions, extractPattern } = require('../classify');
const { BUILTIN_CATEGORIES } = require('../constants');

const BUILTIN_CATEGORIES_SET = new Set(BUILTIN_CATEGORIES);

// Mirrors the client-side AUTOPAY_PATTERNS in csv.js — keep these in sync.
const AUTOPAY_PATTERNS = [
  'autopay',
  'automatic payment',
  'online payment',
  'payment thank you',
  'payment received',
  'payment - thank you',
  'mobile payment',
  'e-payment',
  'web payment',
  'bill payment',
  'directpay',
  'credit card payment',
  'balance transfer',
];

const MAX_RULES_PER_USER = 1000;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 100;

const router = express.Router();
router.use(requireAuth);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Copies recurring categories from the immediately preceding calendar month into targetMonth, skipping duplicates.
function copyRecurringCategories(userId, targetMonth) {
  const [year, month] = targetMonth.split('-').map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const sourceMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  db.prepare(`
    INSERT OR IGNORE INTO categories (user_id, name, month, is_recurring)
    SELECT user_id, name, ?, is_recurring
    FROM categories
    WHERE user_id = ? AND month = ? AND is_recurring = 1
  `).run(targetMonth, userId, sourceMonth);
}

// Returns true if str is a valid YYYY-MM-DD date string.
function isValidDate(str) {
  return typeof str === 'string' && DATE_REGEX.test(str);
}

const MONTH_REGEX = /^\d{4}-\d{2}$/;

// POST /transactions/upload
router.post('/upload', async (req, res) => {
  const { month, rows } = req.body;

  if (!month || !MONTH_REGEX.test(month)) {
    return res.status(400).json({ error: 'month is required (YYYY-MM)' });
  }
  if (!Array.isArray(rows)) {
    return res.status(400).json({ error: 'rows must be an array' });
  }
  if (rows.length > 5000) {
    return res.status(400).json({ error: 'Maximum 5000 rows per upload' });
  }

  // Reject if transactions already exist for this month
  const existing = db.prepare(
    "SELECT 1 FROM transactions WHERE user_id = ? AND strftime('%Y-%m', date) = ? LIMIT 1"
  ).get(req.user.id, month);
  if (existing) {
    return res.status(409).json({ error: `Month ${month} already exists.` });
  }

  // Separate valid rows from invalid ones; ignore rows outside the specified month
  const validRows = [];
  let skipped = 0;

  for (const row of rows) {
    if (!isValidDate(row.date) || typeof row.amount !== 'number' || !isFinite(row.amount)) {
      skipped++;
    } else if (typeof row.description !== 'string') {
      skipped++;
    } else if (row.description.length > MAX_DESCRIPTION_LENGTH) {
      skipped++;
    } else if (!row.date.startsWith(month)) {
      skipped++;
    } else if (AUTOPAY_PATTERNS.some(p => row.description.toLowerCase().includes(p))) {
      skipped++;
    } else {
      validRows.push(row);
    }
  }

  if (validRows.length === 0) {
    return res.json({ inserted: 0, skipped });
  }

  // Copy recurring categories from the preceding calendar month into this month
  copyRecurringCategories(req.user.id, month);

  // Load valid custom categories for this month (includes just-copied recurring ones)
  const customCatRows = db.prepare(
    'SELECT name FROM categories WHERE user_id = ? AND month = ?'
  ).all(req.user.id, month);
  const validCustomCategories = new Set(customCatRows.map(r => r.name));

  // Load learned rules for this user into a Map<pattern, category>
  const rulesRows = db.prepare(
    'SELECT pattern, category FROM classification_rules WHERE user_id = ?'
  ).all(req.user.id);
  const learnedRules = new Map(rulesRows.map(r => [r.pattern, r.category]));

  // Classify all valid rows, checking learned rules before calling Gemini
  let categories, matchedPatterns;
  try {
    ({ categories, matchedPatterns } = await classifyTransactions(
      validRows.map(r => ({ description: r.description, raw_category: r.raw_category })),
      learnedRules
    ));
  } catch (err) {
    console.error('Classification error:', err.message);
    return res.status(500).json({ error: 'Failed to classify transactions' });
  }

  // Reassign any category that doesn't exist for this month to "other"
  for (let i = 0; i < categories.length; i++) {
    if (!BUILTIN_CATEGORIES_SET.has(categories[i]) && !validCustomCategories.has(categories[i])) {
      categories[i] = 'other';
    }
  }

  const insertStmt = db.prepare(
    "INSERT INTO transactions (user_id, date, description, category, amount, source) VALUES (?, ?, ?, ?, ?, 'csv')"
  );
  const incrementStmt = db.prepare(
    'UPDATE classification_rules SET hit_count = hit_count + 1, updated_at = datetime(\'now\') WHERE user_id = ? AND pattern = ?'
  );

  db.exec('BEGIN');
  try {
    for (let i = 0; i < validRows.length; i++) {
      const description = (validRows[i].description ?? '').trim();
      insertStmt.run(req.user.id, validRows[i].date, description, categories[i], validRows[i].amount);
    }
    for (const pattern of matchedPatterns) {
      incrementStmt.run(req.user.id, pattern);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Upload error:', err.message);
    return res.status(500).json({ error: 'Database error during import' });
  }

  res.json({ inserted: validRows.length, skipped });
});

// POST /transactions  — manually add a single transaction
router.post('/', (req, res) => {
  const { date, description, category, amount } = req.body;

  if (!isValidDate(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  if (typeof description !== 'string' || !description.trim()) return res.status(400).json({ error: 'description is required' });
  if (description.length > MAX_DESCRIPTION_LENGTH) return res.status(400).json({ error: `description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` });
  if (typeof category !== 'string' || !category.trim()) return res.status(400).json({ error: 'category is required' });
  if (category.length > MAX_CATEGORY_LENGTH) return res.status(400).json({ error: `category must be ${MAX_CATEGORY_LENGTH} characters or fewer` });
  if (typeof amount !== 'number' || !isFinite(amount)) return res.status(400).json({ error: 'amount must be a number' });

  const result = db.prepare(
    "INSERT INTO transactions (user_id, date, description, category, amount, source) VALUES (?, ?, ?, ?, ?, 'manual')"
  ).run(req.user.id, date, description.trim(), category.trim(), amount);

  res.status(201).json({ id: result.lastInsertRowid, date, description: description.trim(), category: category.trim(), amount, source: 'manual' });
});

// PATCH /transactions/:id  — update category
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const { category } = req.body;
  if (typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ error: 'category must be a non-empty string' });
  }
  if (category.length > MAX_CATEGORY_LENGTH) {
    return res.status(400).json({ error: `category must be ${MAX_CATEGORY_LENGTH} characters or fewer` });
  }

  const tx = db.prepare(
    'SELECT description FROM transactions WHERE id = ? AND user_id = ?'
  ).get(id, req.user.id);

  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  const result = db.prepare(
    'UPDATE transactions SET category = ? WHERE id = ? AND user_id = ?'
  ).run(category.trim(), id, req.user.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Transaction not found' });

  // Learn from this recategorization — evict LFU rule if at cap
  const pattern = extractPattern(tx.description);
  if (pattern) {
    const ruleCount = db.prepare(
      'SELECT COUNT(*) AS cnt FROM classification_rules WHERE user_id = ?'
    ).get(req.user.id).cnt;

    const alreadyExists = db.prepare(
      'SELECT 1 FROM classification_rules WHERE user_id = ? AND pattern = ?'
    ).get(req.user.id, pattern);

    if (!alreadyExists && ruleCount >= MAX_RULES_PER_USER) {
      // Evict the least-frequently-used rule (oldest among ties)
      db.prepare(`
        DELETE FROM classification_rules
        WHERE user_id = ? AND id = (
          SELECT id FROM classification_rules
          WHERE user_id = ?
          ORDER BY hit_count ASC, updated_at ASC
          LIMIT 1
        )
      `).run(req.user.id, req.user.id);
    }

    db.prepare(`
      INSERT INTO classification_rules (user_id, pattern, category, hit_count, updated_at)
      VALUES (?, ?, ?, 0, datetime('now'))
      ON CONFLICT(user_id, pattern) DO UPDATE SET
        category = excluded.category,
        hit_count = 0,
        updated_at = datetime('now')
    `).run(req.user.id, pattern, category.trim());
  }

  res.json({ ok: true });
});

// DELETE /transactions/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const result = db.prepare(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?'
  ).run(id, req.user.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Transaction not found' });
  res.json({ ok: true });
});

// GET /transactions?month=YYYY-MM
router.get('/', (req, res) => {
  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month query parameter required (YYYY-MM)' });
  }

  const transactions = db.prepare(`
    SELECT id, date, description, category, amount, source
    FROM transactions
    WHERE user_id = ?
      AND strftime('%Y-%m', date) = ?
    ORDER BY date DESC, id DESC
  `).all(req.user.id, month);

  res.json(transactions);
});

module.exports = router;
