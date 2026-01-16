import { drizzle } from 'drizzle-orm/node-postgres';
import * as schemas from './schemas/index.ts';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...schemas,
  },
});

export type Database = typeof db;
