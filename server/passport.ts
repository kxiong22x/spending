import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from './db';

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value ?? '';
      const name = profile.displayName;
      const avatarUrl = profile.photos?.[0]?.value ?? null;

      const existing = await db.execute({
        sql: 'SELECT id, email, name, avatar_url FROM users WHERE google_id = ?',
        args: [googleId],
      });

      if (existing.rows.length > 0) {
        return done(null, existing.rows[0] as unknown as Express.User);
      }

      const result = await db.execute({
        sql: 'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)',
        args: [googleId, email, name, avatarUrl],
      });

      const user = await db.execute({
        sql: 'SELECT id, email, name, avatar_url FROM users WHERE id = ?',
        args: [Number(result.lastInsertRowid)],
      });

      return done(null, user.rows[0] as unknown as Express.User);
    } catch (err) {
      return done(err as Error);
    }
  }
));
