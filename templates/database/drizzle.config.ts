import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env from monorepo root (two levels up from packages/database)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..', '..')
config({ path: join(rootDir, '.env') })

export default defineConfig({
  out: './migrations',
  schema: ['./src/schemas/*.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: false,
  },
})
