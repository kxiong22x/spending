import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

// Only expose non-sensitive fields to route handlers
export default async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token: string | undefined = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET) as { userId: number };
    const result = await db.execute({
      sql: 'SELECT id, email, name, avatar_url FROM users WHERE id = ?',
      args: [userId],
    });

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = result.rows[0] as unknown as Express.User;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
