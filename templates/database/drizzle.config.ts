import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './migrations',
  schema: ['./src/test-schema.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: false,
  },
})
