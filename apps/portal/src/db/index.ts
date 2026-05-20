import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@brio-md/db';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });