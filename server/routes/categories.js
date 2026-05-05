const express = require('express');
const { db } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { BUILTIN_CATEGORIES } = require('../constants');

const router = express.Router();
router.use(requireAuth);

const BUILTIN_CATEGORIES_SET = new Set(BUILTIN_CATEGORIES);
const MAX_NAME_LENGTH = 50;
const MONTH_REGEX = /^\d{4}-\d{2}$/;

// GET /categories?month=YYYY-MM
router.get('/', async (req, res) => {
  const { month } = req.query;
  if (!month || !MONTH_REGEX.test(month)) {
    return res.status(400).json({ error: 'month query parameter required (YYYY-MM)' });
  }
  const result = await db.execute({
    sql: 'SELECT name, is_recurring FROM categories WHERE user_id = ? AND month = ? ORDER BY created_at ASC, id ASC',
    args: [req.user.id, month],
  });
  res.json(result.rows);
});

// POST /categories
router.post('/', async (req, res, next) => {
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
    await db.execute({
      sql: 'INSERT INTO categories (user_id, name, month, is_recurring) VALUES (?, ?, ?, ?)',
      args: [req.user.id, name, month, recurring],
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: `Category "${name}" already exists for this month` });
    return next(err);
  }

  res.status(201).json({ name, is_recurring: recurring });
});

// DELETE /categories/:name?month=YYYY-MM
router.delete('/:name', async (req, res) => {
  const name = req.params.name;
  const { month } = req.query;

  if (BUILTIN_CATEGORIES_SET.has(name.toLowerCase())) {
    return res.status(400).json({ error: 'Cannot delete a built-in category' });
  }
  if (!month || !MONTH_REGEX.test(month)) {
    return res.status(400).json({ error: 'month query parameter required (YYYY-MM)' });
  }

  const txn = await db.transaction('write');
  try {
    const deleteResult = await txn.execute({
      sql: 'DELETE FROM categories WHERE user_id = ? AND name = ? AND month = ?',
      args: [req.user.id, name, month],
    });

    if (deleteResult.rowsAffected === 0) {
      await txn.rollback();
      return res.status(404).json({ error: 'Category not found' });
    }

    await txn.execute({
      sql: `UPDATE transactions SET category = 'other' WHERE user_id = ? AND category = ? AND strftime('%Y-%m', date) = ?`,
      args: [req.user.id, name, month],
    });

    await txn.commit();
  } catch (err) {
    await txn.rollback();
    throw err;
  }

  res.json({ ok: true });
});

module.exports = router;
