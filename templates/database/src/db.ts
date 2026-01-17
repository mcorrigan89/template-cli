import { getServerEnv } from '@template/env/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schemas from './schemas/index.ts';

const env = getServerEnv();

export const db = drizzle(env.DATABASE_URL, {
  schema: {
    ...schemas,
  },
});

export type Database = typeof db;
