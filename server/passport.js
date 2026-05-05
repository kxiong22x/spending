const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { db } = require('./db');

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const avatarUrl = profile.photos[0]?.value ?? null;

      const existing = await db.execute({
        sql: 'SELECT id, email, name, avatar_url FROM users WHERE google_id = ?',
        args: [googleId],
      });

      if (existing.rows.length > 0) {
        return done(null, existing.rows[0]);
      }

      const result = await db.execute({
        sql: 'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)',
        args: [googleId, email, name, avatarUrl],
      });

      const user = await db.execute({
        sql: 'SELECT id, email, name, avatar_url FROM users WHERE id = ?',
        args: [Number(result.lastInsertRowid)],
      });

      return done(null, user.rows[0]);
    } catch (err) {
      return done(err);
    }
  }
));
