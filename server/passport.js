const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const db = require('./db');

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const avatarUrl = profile.photos[0]?.value ?? null;

      const existing = db
        .prepare('SELECT id, email, name, avatar_url FROM users WHERE google_id = ?')
        .get(googleId);

      if (existing) {
        return done(null, existing);
      }

      const result = db
        .prepare(
          'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)'
        )
        .run(googleId, email, name, avatarUrl);

      const user = db
        .prepare('SELECT id, email, name, avatar_url FROM users WHERE id = ?')
        .get(result.lastInsertRowid);

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));
