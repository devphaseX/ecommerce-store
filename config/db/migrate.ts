import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const migrationClient = postgres('', { max: 1 });
migrate(drizzle(migrationClient), { migrationsFolder: 'drizzle' })
  .then(() => {
    console.log('migration completed');
  })
  .catch((e) => {
    console.log('something went wrong while migrating');
    console.log(e);
  });
