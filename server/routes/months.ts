import express from 'express';
import { db } from '../db';
import requireAuth from '../middleware/requireAuth';
import { MONTH_REGEX } from '../constants';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await db.execute({
    sql: `SELECT DISTINCT strftime('%Y-%m', date) AS month
          FROM transactions
          WHERE user_id = ?
          ORDER BY month DESC`,
    args: [req.user!.id],
  });
  res.json(result.rows.map(r => r.month));
});

// DELETE /months/:yearMonth  — delete all transactions for a month
router.delete('/:yearMonth', async (req, res) => {
  const { yearMonth } = req.params;
  if (!MONTH_REGEX.test(yearMonth)) {
    return res.status(400).json({ error: 'Invalid month format (expected YYYY-MM)' });
  }

  const result = await db.execute({
    sql: `DELETE FROM transactions WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
    args: [req.user!.id, yearMonth],
  });

  if (result.rowsAffected === 0) return res.status(404).json({ error: 'Month not found' });
  res.json({ ok: true });
});

export default router;
