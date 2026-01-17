import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from monorepo root (two levels up from packages/database)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');
config({ path: join(rootDir, '.env') });

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('🔄 Connecting to database...');
  await client.connect();

  const db = drizzle(client);

  console.log('🔄 Running migrations...');
  await migrate(db, { migrationsFolder: './migrations' });

  console.log('✅ Migrations completed successfully!');
  await client.end();
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
