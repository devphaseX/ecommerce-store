import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../schema/';
const client = postgres('');

const db = drizzle(client, { schema });

export { db };
