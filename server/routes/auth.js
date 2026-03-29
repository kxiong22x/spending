const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const requireAuth = require('../middleware/requireAuth');
const db = require('../db');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,                                          // JS cannot read this cookie
  secure: process.env.NODE_ENV === 'production',          // HTTPS only in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,                       // 7 days
};

// Step 1: redirect to Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// Step 2: Google redirects back here with user profile
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, COOKIE_OPTIONS);
    res.redirect(process.env.CLIENT_URL);
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Returns the logged-in user's non-sensitive profile info
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// Deletes the authenticated user's account and all associated data
router.delete('/account', requireAuth, (req, res) => {
  const userId = req.user.id;
  db.transaction(() => {
    db.prepare('DELETE FROM classification_rules WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  })();
  res.clearCookie('token');
  res.status(204).end();
});

module.exports = router;
