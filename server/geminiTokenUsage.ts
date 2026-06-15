import { db } from './db';

const DEFAULT_DAILY_TOKEN_LIMIT = 1_000_000;

// Returns today's date as a YYYY-MM-DD string.
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Returns the number of Gemini tokens used today.
export async function getTodayUsage(): Promise<number> {
  const result = await db.execute({
    sql: 'SELECT tokens_used FROM gemini_usage WHERE date = ?',
    args: [today()],
  });
  return result.rows.length > 0 ? Number(result.rows[0].tokens_used) : 0;
}

// Adds tokensUsed to today's running Gemini token total.
export async function recordUsage(tokensUsed: number): Promise<void> {
  await db.execute({
    sql: `INSERT INTO gemini_usage (date, tokens_used) VALUES (?, ?)
          ON CONFLICT(date) DO UPDATE SET tokens_used = tokens_used + excluded.tokens_used`,
    args: [today(), tokensUsed],
  });
}

// Returns the configured daily token limit from the environment.
export function getDailyTokenLimit(): number {
  return parseInt(process.env.GEMINI_DAILY_TOKEN_LIMIT ?? String(DEFAULT_DAILY_TOKEN_LIMIT), 10);
}
