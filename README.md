# Spending Tracker

A personal finance web app for uploading, categorizing, and visualizing your monthly transactions. Import transactions from CSVs (one per card), manually add expenses, drag and drop them between categories, and view spending breakdowns in a pie chart.

## Features

- **Google OAuth** sign-in
- **Card management** — register named cards (e.g. "AMEX 5543") and assign each CSV upload to a specific card
- **CSV bulk upload** — import up to 5000 transactions at once, with one CSV per card
- **Manual transaction entry**
- **AI-powered classification** — transactions are auto-categorized using Google Gemini 2.5 Flash; the app learns from corrections you make
- **Custom categories** per month, with optional recurring categories
- **Drag-and-drop** to reassign transactions between categories
- **Pie chart** visualization of monthly spending (by category and by card)
- **Month-by-month navigation**

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite, TypeScript |
| Backend | Node.js, Express 4, TypeScript |
| Database | SQLite (Turso cloud) via `@libsql/client` |
| Auth | Google OAuth 2.0, JWT (HTTP-only cookies) |
| AI | Google Gemini 2.5 Flash |

## Project Structure

```
spending/
├── shared/          # Types and constants shared between client and server
│   ├── types.ts         # Shared TypeScript interfaces
│   └── constants.json   # Shared constants (categories, validation patterns)
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/       # Login, Dashboard, MonthPage, MyCards
│       ├── components/  # UI components
│       ├── constants/   # Client constants (colors, category order, API URL)
│       ├── hooks/       # Data-fetching hooks
│       └── utils/       # CSV parsing, formatting helpers
└── server/          # Express backend
    ├── routes/      # auth, transactions, categories, months, cards
    ├── middleware/  # JWT auth guard
    ├── classify.ts  # Gemini classification + keyword fallback
    ├── constants.ts # Server-side constants
    ├── db.ts        # Turso client + schema setup
    ├── passport.ts  # Google OAuth strategy
    └── types.d.ts   # Express type augmentations
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Turso](https://turso.tech) database (free tier available)
- A Google Cloud project with OAuth 2.0 credentials
- A Google AI Studio API key (Gemini)

### Setup

**1. Clone the repo**

```bash
git clone <repo-url>
cd spending
```

**2. Configure the server**

```bash
cd server
cp .env.example .env
```

Fill in the values in `.env`:

```env
TURSO_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

GOOGLE_AI_API_KEY=        # Google Gemini API key
GEMINI_DAILY_TOKEN_LIMIT= # Optional; defaults to 1,000,000 tokens/day

GOOGLE_CLIENT_ID=         # Google OAuth client ID
GOOGLE_CLIENT_SECRET=     # Google OAuth client secret
GOOGLE_CALLBACK_URL=      # e.g. http://localhost:3001/auth/google/callback
JWT_SECRET=               # Random string, at least 32 characters
CLIENT_URL=               # e.g. http://localhost:5173
PORT=3001
NODE_ENV=development
```

**3. Install dependencies and start the server**

```bash
npm install
npm run dev
```

The server runs on `http://localhost:3001`.

**4. Install dependencies and start the client**

```bash
cd ../client
npm install
npm run dev
```

The client runs on `http://localhost:5173`.

### Google OAuth Setup

In [Google Cloud Console](https://console.cloud.google.com):

1. Create an OAuth 2.0 client (Web application)
2. Add `http://localhost:3001/auth/google/callback` as an authorized redirect URI
3. Copy the client ID and secret into your `.env`

## API Overview

All endpoints except `/auth/google` require authentication via JWT cookie.

| Method | Path | Description |
|---|---|---|
| `GET` | `/ping` | Health check |
| `GET` | `/auth/google` | Initiate Google OAuth flow |
| `GET` | `/auth/me` | Get current user |
| `POST` | `/auth/logout` | Log out |
| `DELETE` | `/auth/account` | Delete account and all data |
| `GET` | `/transactions?month=YYYY-MM` | List transactions for a month |
| `POST` | `/transactions` | Add a transaction manually |
| `POST` | `/transactions/upload` | Bulk import from CSV |
| `PATCH` | `/transactions/:id` | Update transaction category |
| `DELETE` | `/transactions/:id` | Delete a transaction |
| `GET` | `/categories?month=YYYY-MM` | List categories for a month |
| `POST` | `/categories` | Create a custom category |
| `DELETE` | `/categories/:name` | Delete a category |
| `GET` | `/months` | List all months with transactions |
| `DELETE` | `/months/:yearMonth` | Delete a month and all its transactions |
| `GET` | `/cards` | List registered cards |
| `POST` | `/cards` | Register a new card |
| `DELETE` | `/cards/:id` | Delete a card (only if it has no transactions) |

### CSV Format

Each CSV file is associated with a specific registered card at upload time. The parser accepts the default output from most banks' CSV export feature.

## Rate Limits

To guard against excessive API usage:

| Endpoint | Limit |
|---|---|
| General | 200 requests / 15 min |
| Write operations (transactions, categories, cards) | 60 requests / hour |
| CSV upload | 20 requests / hour |
| Account deletion | 5 requests / hour |

When the `GEMINI_DAILY_TOKEN_LIMIT` is reached, CSV uploads are blocked for the remainder of the day. If the Gemini API key is absent or a Gemini call fails, classification falls back to a built-in keyword-matching system so the app continues to work.

## Security

- Sessions use HTTP-only, `SameSite=strict` JWT cookies — inaccessible to JavaScript
- All database queries are scoped to the authenticated user's ID
- Card ownership is verified before any upload or deletion
- No sensitive personal information is sent to the client
- Input is validated and length-limited server-side
- Security headers applied via `helmet`
