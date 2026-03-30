require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const { rateLimit } = require('express-rate-limit');

require('./passport'); // register Google strategy
require('./db');  // initializes DB + tables on startup
const authRoutes = require('./routes/auth');
const monthsRoutes = require('./routes/months');
const transactionsRoutes = require('./routes/transactions');
const categoriesRoutes = require('./routes/categories');

// Fail fast if any required secret is missing or too short to be safe
const REQUIRED_ENV_VARS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'JWT_SECRET', 'GOOGLE_AI_API_KEY'];
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
const clientOrigin = new URL(process.env.CLIENT_URL || 'http://localhost:5173').origin;
app.use(cors({
  origin: clientOrigin,
  credentials: true, // required for cookies to be sent cross-origin
}));

// Higher body limit for CSV upload rows; tight limit everywhere else
app.use('/transactions/upload', express.json({ limit: '2mb' }));
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());
app.use(passport.initialize());

// General rate limit: 200 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// Tighter limit on the upload endpoint to guard against Gemini API cost
app.use('/transactions/upload', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached. Please wait before uploading again.' },
}));

// Stricter limits on write endpoints: 60 requests per hour per IP
const writeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.post('/transactions', writeRateLimit);
app.post('/categories', writeRateLimit);
app.delete('/categories/:name', writeRateLimit);

// Very tight limit on account deletion to prevent abuse
const accountDeleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.delete('/auth/account', accountDeleteLimiter);

// Health check endpoint for uptime monitoring
app.get('/ping', (req, res) => res.sendStatus(200));

app.use('/auth', authRoutes);
app.use('/months', monthsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/categories', categoriesRoutes);

// Centralized error handler — must have 4 parameters so Express treats it as an error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
