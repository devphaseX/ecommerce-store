import type { Config } from 'drizzle-kit';
import { parsedEnv } from './config/env';

export default {
  schema: './schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: { connectionString: parsedEnv.DATABASE_URL, ssl: true },
} satisfies Config;
