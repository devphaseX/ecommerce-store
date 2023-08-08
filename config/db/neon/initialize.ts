import { migrate } from 'drizzle-orm/neon-http/migrator';
import { parsedEnv } from '../../env';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/schema/index';

neonConfig.fetchConnectionCache = true;

const postgres = neon(parsedEnv.DATABASE_URL!);
const db = drizzle(postgres, { schema });

export { db };
