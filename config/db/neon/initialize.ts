import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { parsedEnv } from '../../env';
import * as schema from '@/schema/index';

const pool = new Pool({ connectionString: parsedEnv.DATABASE_URL });
const db = drizzle(pool, { schema });

export { db };
