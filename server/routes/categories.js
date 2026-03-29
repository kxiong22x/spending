const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { BUILTIN_CATEGORIES } = require('../constants');

const router = express.Router();
router.use(requireAuth);

const BUILTIN_CATEGORIES_SET = new Set(BUILTIN_CATEGORIES);
const MAX_NAME_LENGTH = 50;
const MONTH_REGEX = /^\d{4}-\d{2}$/;

// GET /categories?month=YYYY-MM
router.get('/', (req, res) => {
  const { month } = req.query;
  if (!month || !MONTH_REGEX.test(month)) {
    return res.status(400).json({ error: 'month query parameter required (YYYY-MM)' });
  }
  const rows = db.prepare(
    'SELECT name, is_recurring FROM categories WHERE user_id = ? AND month = ? ORDER BY created_at ASC, id ASC'
  ).all(req.user.id, month);
  res.json(rows);
});

// POST /categories
router.post('/', (req, res, next) => {
  const raw = req.body.name;
  const { month, is_recurring } = req.body;

  if (typeof raw !== 'string') return res.status(400).json({ error: 'name is required' });
  const name = raw.trim();
  if (!name) return res.status(400).json({ error: 'name must not be empty' });
  if (name.length > MAX_NAME_LENGTH) return res.status(400).json({ error: `name must be ${MAX_NAME_LENGTH} characters or fewer` });
  if (BUILTIN_CATEGORIES_SET.has(name.toLowerCase())) return res.status(400).json({ error: `"${name}" is a built-in category` });
  if (!month || !MONTH_REGEX.test(month)) return res.status(400).json({ error: 'month is required (YYYY-MM)' });

  const recurring = is_recurring === false ? 0 : 1;

  try {
    db.prepare('INSERT INTO categories (user_id, name, month, is_recurring) VALUES (?, ?, ?, ?)').run(req.user.id, name, month, recurring);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: `Category "${name}" already exists for this month` });
    return next(err);
  }

  res.status(201).json({ name, is_recurring: recurring });
});

// DELETE /categories/:name?month=YYYY-MM
router.delete('/:name', (req, res) => {
  const name = req.params.name;
  const { month } = req.query;

  if (BUILTIN_CATEGORIES_SET.has(name.toLowerCase())) {
    return res.status(400).json({ error: 'Cannot delete a built-in category' });
  }
  if (!month || !MONTH_REGEX.test(month)) {
    return res.status(400).json({ error: 'month query parameter required (YYYY-MM)' });
  }

  const deleteCategory = db.transaction((userId, catName, catMonth) => {
    const result = db.prepare(
      'DELETE FROM categories WHERE user_id = ? AND name = ? AND month = ?'
    ).run(userId, catName, catMonth);

    if (result.changes === 0) return null;

    // Move this month's transactions in the deleted category to "other"
    db.prepare(`
      UPDATE transactions
      SET category = 'other'
      WHERE user_id = ? AND category = ? AND strftime('%Y-%m', date) = ?
    `).run(userId, catName, catMonth);

    return result;
  });

  const result = deleteCategory(req.user.id, name, month);
  if (!result) return res.status(404).json({ error: 'Category not found' });

  res.json({ ok: true });
});

module.exports = router;
