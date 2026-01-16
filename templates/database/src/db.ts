import { drizzle } from 'drizzle-orm/node-postgres'
import * as authSchema from './auth-schema.ts'

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...authSchema,
  },
})

export type Database = typeof db
