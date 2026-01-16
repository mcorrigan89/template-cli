import { drizzle } from 'drizzle-orm/node-postgres';
import * as testSchema from './test-schema.ts';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...testSchema,
  },
});

export type Database = typeof db;
