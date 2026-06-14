import express, { NextFunction } from 'express';
import { db } from '../db';
import requireAuth from '../middleware/requireAuth';
import { MAX_NAME_LENGTH } from '../constants';

const router = express.Router();
router.use(requireAuth);

// GET /cards — list all cards for the logged-in user
router.get('/', async (req, res, next: NextFunction) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, name FROM cards WHERE user_id = ? ORDER BY id ASC',
      args: [req.user!.id],
    });
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /cards — register a new card
router.post('/', async (req, res, next: NextFunction) => {
  const raw: unknown = req.body.name;
  if (typeof raw !== 'string') return res.status(400).json({ error: 'name is required' });
  const name = raw.trim();
  if (!name) return res.status(400).json({ error: 'name must not be empty' });
  if (name.length > MAX_NAME_LENGTH) return res.status(400).json({ error: `name must be ${MAX_NAME_LENGTH} characters or fewer` });

  try {
    const result = await db.execute({
      sql: 'INSERT INTO cards (user_id, name) VALUES (?, ?) RETURNING id, name',
      args: [req.user!.id, name],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if ((err as Error).message.includes('UNIQUE')) return res.status(409).json({ error: `Card "${name}" is already registered` });
    next(err);
  }
});

// DELETE /cards/:id — delete a card owned by the logged-in user
router.delete('/:id', async (req, res, next: NextFunction) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });

  try {
    const txCheck = await db.execute({
      sql: 'SELECT 1 FROM transactions WHERE card_id = ? AND user_id = ? LIMIT 1',
      args: [id, req.user!.id],
    });
    if (txCheck.rows.length > 0) {
      return res.status(409).json({ error: 'You cannot delete this card because there are transactions associated with it.' });
    }

    const result = await db.execute({
      sql: 'DELETE FROM cards WHERE id = ? AND user_id = ?',
      args: [id, req.user!.id],
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Card not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
