import { migrate } from 'drizzle-orm/neon-http/migrator';
import { parsedEnv } from '../../env';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

neonConfig.fetchConnectionCache = true;

const postgres = neon(parsedEnv.DATABASE_URL!);
const db = drizzle(postgres);

migrate(db, { migrationsFolder: 'drizzle' })
  .then(() => {
    console.log('migration completed');
  })
  .catch((e) => {
    console.log('something went wrong while migrating');
    console.log(e);
  });

export { db };
