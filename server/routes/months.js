const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const months = db.prepare(`
    SELECT DISTINCT strftime('%Y-%m', date) AS month
    FROM transactions
    WHERE user_id = ?
    ORDER BY month DESC
  `).all(req.user.id);

  res.json(months.map(r => r.month));
});

// DELETE /months/:yearMonth  — delete all transactions for a month
router.delete('/:yearMonth', (req, res) => {
  const { yearMonth } = req.params;
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return res.status(400).json({ error: 'Invalid month format (expected YYYY-MM)' });
  }

  const result = db.prepare(`
    DELETE FROM transactions
    WHERE user_id = ? AND strftime('%Y-%m', date) = ?
  `).run(req.user.id, yearMonth);

  if (result.changes === 0) return res.status(404).json({ error: 'Month not found' });

  res.json({ ok: true });
});

module.exports = router;
