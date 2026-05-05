const jwt = require('jsonwebtoken');
const { db } = require('../db');

// Only expose non-sensitive fields to route handlers
module.exports = async function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.execute({
      sql: 'SELECT id, email, name, avatar_url FROM users WHERE id = ?',
      args: [userId],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
