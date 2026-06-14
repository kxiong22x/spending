import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import { initDb } from '../server/db';
import app from '../server/index';

const dbReady = initDb();

// Awaits DB init on the first cold start; subsequent requests skip the await.
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await dbReady;
  app(req as any, res as any);
}
