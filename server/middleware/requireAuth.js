const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    // Only expose non-sensitive fields to route handlers
    const user = db
      .prepare('SELECT id, email, name, avatar_url FROM users WHERE id = ?')
      .get(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
