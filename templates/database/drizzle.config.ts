import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './migrations',
  schema: ['./src/database/auth-schema.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: false,
  },
})
