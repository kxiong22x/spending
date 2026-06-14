import { db } from './db';
import type { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';

// Rate limit store backed by Turso, safe across serverless instances.
export class TursoRateLimitStore implements Store {
  private windowMs = 60_000;

  constructor(private readonly prefix: string) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const now = Date.now();
    const newReset = now + this.windowMs;
    const prefixedKey = `${this.prefix}:${key}`;

    const result = await db.execute({
      sql: `INSERT INTO rate_limits (key, hits, reset_time) VALUES (?, 1, ?)
            ON CONFLICT(key) DO UPDATE SET
              hits       = CASE WHEN reset_time <= ? THEN 1    ELSE hits + 1 END,
              reset_time = CASE WHEN reset_time <= ? THEN ?    ELSE reset_time END
            RETURNING hits, reset_time`,
      args: [prefixedKey, newReset, now, now, newReset],
    });

    const row = result.rows[0];
    return {
      totalHits: Number(row.hits),
      resetTime: new Date(Number(row.reset_time)),
    };
  }

  async decrement(key: string): Promise<void> {
    await db.execute({
      sql: 'UPDATE rate_limits SET hits = MAX(0, hits - 1) WHERE key = ?',
      args: [`${this.prefix}:${key}`],
    });
  }

  async resetKey(key: string): Promise<void> {
    await db.execute({
      sql: 'DELETE FROM rate_limits WHERE key = ?',
      args: [`${this.prefix}:${key}`],
    });
  }
}
