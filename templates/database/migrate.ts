import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

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
