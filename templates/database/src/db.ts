import { drizzle } from 'drizzle-orm/node-postgres';
import * as schemas from './schemas/index.ts';

export const createDatabase = (databaseUrl: string) => {
  console.log(databaseUrl);
  const db = drizzle(databaseUrl, {
    schema: {
      ...schemas,
    },
  });

  return db;
};

export type Database = ReturnType<typeof createDatabase>;

export const dbMock = drizzle.mock({
  schema: {
    ...schemas,
  },
});
