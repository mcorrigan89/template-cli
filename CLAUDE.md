# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A CLI tool for generating TypeScript monorepo projects from pre-created templates. The tool discovers available templates in the `templates/` directory, lets users multi-select which ones to include, and scaffolds a complete pnpm workspace with optional features like ESLint, Prettier, Changesets, and GitHub Actions.

## Commands

### Development
```bash
# Build the CLI
pnpm run build

# Watch mode (rebuild on changes)
pnpm run dev
```

### Testing the CLI locally
```bash
# After building, run locally
node dist/index.js

# Or install globally and use
npm link
create-my-template
```

## Architecture

### Entry Point (`src/index.ts`)

The CLI is a single-file interactive prompt-based generator that:

1. **Collects configuration** via `prompts`:
   - Monorepo name and workspace prefix (e.g., `@my-org`)
   - Features (ESLint, Prettier, Changesets, Husky, GitHub Actions)
   - Note: TypeScript is always enabled, pnpm scripts are always used (no Turborepo/Nx)

2. **Discovers available templates**:
   - Scans `templates/` directory for subdirectories (excluding `base/` and `features/`)
   - Reads `template.json` metadata from each template
   - Defaults to `type: "package"` if metadata is missing

3. **Multi-select template prompt**:
   - Shows all discovered templates with their type (app/package) and description
   - Users can select any combination of templates
   - Selected templates are copied to the monorepo

4. **Scaffolds the monorepo** in order:
   - Root structure (package.json, workspace config, build tool config)
   - Templates copied to `apps/*` or `packages/*` based on metadata
   - Feature configurations

### Key Functions

- `discoverTemplates()`: Scans templates directory and reads template.json metadata for each template
- `createFromTemplate()`: Copies a template to the appropriate directory (apps/ or packages/) and replaces all `@workspace/` references in package.json with the actual workspace prefix
- `createRootStructure()`: Sets up root package.json with pnpm scripts, pnpm-workspace.yaml, .gitignore, and README
- `scaffoldMonorepo()`: Orchestrates the monorepo creation by calling the above functions
- `addFeatures()`: Adds optional root-level tooling:
  - Installs dependencies for selected features (eslint, prettier, husky, changesets) to root
  - Adds root-level scripts (lint, format, prepare) that run across all workspaces
  - Copies root-level feature files (husky hooks, GitHub Actions)
  - Initializes changesets config if selected
  - Note: Template configs (ESLint, Prettier, Docker) are already in templates

### Template Structure

Each template in `templates/` should have:

1. **`template.json`** (metadata file):
   ```json
   {
     "name": "template-name",
     "type": "app" | "package",
     "description": "Human-readable description"
   }
   ```
   - `name`: Template identifier (usually matches directory name)
   - `type`: Determines if template goes to `apps/` or `packages/`
   - `description`: Shown in selection prompt

2. **Template contents**: Complete, ready-to-use project structure
   - Should include `package.json` with `@workspace/` placeholder for workspace references
   - Should include `.eslintrc.json` and `.prettierrc` configs
   - Can include `Dockerfile`, `.dockerignore`, `docker-compose.yml` for apps
   - Can include any other files/folders needed for the project
   - `template.json` itself is not copied to the output

### Workspace Placeholder Pattern

Use `@workspace/` as a placeholder in template `package.json` files:

```json
{
  "name": "@workspace/my-package",
  "dependencies": {
    "@workspace/other-package": "workspace:*"
  }
}
```

The CLI will replace all `@workspace/` references with the actual workspace prefix (e.g., `@my-org/`).

### Templates Directory

The `templates/` directory is copied alongside the built CLI during distribution:
- `templates/base/`: Base configuration files (pnpm-workspace.yaml, .prettierignore)
- `templates/{name}/`: Individual templates with complete configurations
  - `templates/web/`: App template with ESLint, Prettier, Docker configs
  - `templates/server/`: App template with ESLint, Prettier, Docker configs
  - `templates/contract/`: Package template with ESLint, Prettier configs
- `templates/features/`: Root-level feature configurations only
  - `husky/`: Git hooks (.husky/pre-commit, .husky/commit-msg)
  - `github-actions/`: CI workflow (.github/workflows/ci.yml)
  - `changesets/`: Config generated programmatically

**Note**: ESLint, Prettier, and Docker configs are in each template directory, not in features. Each template is self-contained.

## Important Patterns

### Package Manager and Build System
- Only supports `pnpm` (hardcoded)
- Uses `pnpm-workspace.yaml` for workspace configuration
- Root scripts use pnpm's built-in commands:
  - `pnpm run --parallel dev` - Run dev in all workspaces in parallel
  - `pnpm run -r build` - Run build recursively in dependency order
  - `pnpm run -r lint/test/clean` - Run other commands recursively
- No build orchestration tools (Turborepo/Nx) - uses pnpm directly

### TypeScript
- TypeScript is always enabled
- Root devDependencies includes `typescript: ^5.3.0`
- Templates should include their own TypeScript configurations

### Module System
- The CLI uses ES modules (`"type": "module"` in package.json)
- All imports use `.js` extensions in the built output
- Uses `import.meta.url` and `fileURLToPath` to resolve template paths

### Template Discovery
- Templates are discovered at runtime by scanning the filesystem
- Directory names become template identifiers
- Templates without `template.json` default to `type: "package"`
- Invalid or empty templates are skipped with warnings

### Template Resolution
Templates are resolved relative to the built `dist/index.js` file:
```typescript
const templatesDir = path.join(__dirname, '..', 'templates');
```

### Package.json Updates
When copying templates:
- The CLI reads the template's `package.json` as a string
- Replaces all `@workspace/` references with the actual workspace prefix (e.g., `@my-org/`)
- This updates the `name` field and any workspace dependencies
- Preserves all other fields and formatting from the template

## Distribution

The CLI is published with:
- `bin` entry pointing to `dist/index.js` (with shebang `#!/usr/bin/env node`)
- `files` array includes `dist` and `templates` directories
- `prepublishOnly` script ensures build happens before publishing

## Adding New Templates

To add a new template:
1. Create a directory in `templates/` (e.g., `templates/my-template/`)
2. Add a `template.json` file with metadata
3. Add complete project structure (package.json, source files, configs, etc.)
4. The template will automatically be discovered and available in the CLI

## Features

The CLI includes optional features that add tooling and configuration:

### ESLint
- Installs ESLint and TypeScript plugins to root devDependencies
- Each template already includes its own `.eslintrc.json` (copied with template)
- Root scripts: `lint` (runs `pnpm run -r lint`), `lint:fix`
- Each template can have different ESLint rules as needed

### Prettier
- Installs Prettier to root devDependencies
- Each template already includes its own `.prettierrc` (copied with template)
- Root scripts: `format` (runs `pnpm run -r format`), `format:check`
- Each template can have different formatting rules as needed

### Changesets
- Adds `.changeset/config.json` for version management
- Installs: `@changesets/cli`
- Used for managing package versions and changelogs

### Husky
- Adds `.husky/pre-commit` hook (runs lint)
- Adds `.husky/commit-msg` hook (placeholder for commit linting)
- Installs: `husky`
- Scripts: `prepare` (installs git hooks)

### GitHub Actions
- Adds `.github/workflows/ci.yml` for CI/CD
- Runs: lint, type-check, test, build on push/PR
- Uses pnpm with caching

## Docker

Docker configurations are included directly in templates (not a feature):
- Web and Server templates include: `Dockerfile`, `.dockerignore`, `docker-compose.yml`
- Package templates (like contract) don't include Docker files
- Multi-stage production builds with pnpm
- Security best practices (non-root user, minimal Alpine images)
- Each template can customize its Docker configuration independently

## Using Drizzle ORM (Database Package)

The `database` package template includes Drizzle ORM configured for PostgreSQL with type-safe queries and automatic migrations.

### Package Structure

```
packages/database/
├── src/
│   ├── index.ts              # Exports db instance and Database type
│   ├── db.ts                 # Drizzle client configuration
│   └── schemas/
│       ├── index.ts          # Re-exports all schemas
│       └── auth-schema.ts    # Example schema (Better Auth tables)
├── migrations/               # Auto-generated migration files
├── migrate.ts               # Migration runner script
├── drizzle.config.ts        # Drizzle Kit configuration
└── package.json
```

### Configuration Files

**drizzle.config.ts** - Configure schema location and database connection:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './migrations',
  schema: ['./src/schemas/*.ts'],  // Update to include your schemas
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: false,
  },
})
```

**src/db.ts** - Database client with schema:
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schemas from './schemas/index.ts';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...schemas,
  },
});

export type Database = typeof db;
```

### Defining Schemas

Create schema files in `src/schemas/`:

```typescript
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Define relations for type-safe joins
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
```

Export all schemas in `src/schemas/index.ts`:
```typescript
export * from './auth-schema.ts';
export * from './your-schema.ts';
```

### Available Scripts

```bash
# Generate migration files from schema changes
pnpm db:generate

# Apply migrations to database (using drizzle-kit)
pnpm db:migrate

# Run migrations programmatically (uses migrate.ts)
pnpm migrate

# Lint the code
pnpm lint

# Format the code
pnpm format
```

### Workflow: Making Schema Changes

1. **Update your schema** in `src/schemas/`:
   ```typescript
   export const posts = pgTable('posts', {
     id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
     title: text('title').notNull(),
     content: text('content'),
     userId: uuid('user_id').notNull().references(() => users.id),
   });
   ```

2. **Generate migration**:
   ```bash
   pnpm db:generate
   ```
   This creates a new migration file in `migrations/` with SQL statements.

3. **Apply migration**:
   ```bash
   pnpm migrate
   ```
   Or use Docker which automatically runs migrations on startup.

### Using the Database in Other Packages

Import the db instance and use Drizzle's query API:

```typescript
import { db } from '@workspace/database';
import { users, posts } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

// Insert
const newUser = await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com',
}).returning();

// Select with relations
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    posts: true,
  },
});

// Update
await db.update(users)
  .set({ name: 'Jane Doe' })
  .where(eq(users.id, userId));

// Delete
await db.delete(posts)
  .where(eq(posts.userId, userId));
```

### Migration in Docker

The `docker-compose.yml` automatically runs migrations on startup:

```yaml
migrate:
  build:
    context: .
    dockerfile: packages/database/Dockerfile.migrate
  environment:
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/myapp
  depends_on:
    postgres:
      condition: service_healthy
```

The migrate service:
1. Waits for PostgreSQL to be healthy
2. Runs all pending migrations
3. Exits when complete
4. Other services (server, web) wait for migrations to finish

### Environment Variables

Required environment variable:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

### Type Safety

Drizzle provides full TypeScript inference:

```typescript
// Schema types are automatically inferred
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;

// Query results are fully typed
const user: User = await db.query.users.findFirst({
  where: eq(users.id, userId),
});
```

### Common Patterns

**Transactions:**
```typescript
await db.transaction(async (tx) => {
  const user = await tx.insert(users).values(newUser).returning();
  await tx.insert(posts).values({ userId: user[0].id, title: 'First post' });
});
```

**Joins:**
```typescript
const results = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId));
```

**Aggregations:**
```typescript
import { count } from 'drizzle-orm';

const userCount = await db
  .select({ count: count() })
  .from(users);
```

### Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit (Migrations)](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg)

## ORPC Event Iterators and Real-Time Subscriptions

The templates include support for real-time streaming and subscriptions using ORPC's Event Iterator feature, which enables Server-Sent Events (SSE) for live updates.

### Contract Definition

Event iterators are defined using the `eventIterator()` helper from `@orpc/contract`:

```typescript
import { oc, eventIterator } from '@orpc/contract';
import { z } from 'zod';

// Define an event iterator contract
export const counterSubscription = oc
  .input(z.object({ interval: z.number().optional().default(1000) }))
  .output(eventIterator(z.object({ count: z.number(), timestamp: z.string() })));
```

**Important**: Always wrap the output schema with `eventIterator()` for streaming endpoints. This signals that the endpoint will return a stream of events rather than a single response.

### Server Implementation

Implement event iterators using async generator functions with `.handler()`:

```typescript
import { publicRoute } from './base.ts';

const counter = publicRoute.subscriptions.counter.handler(async function* ({ input }) {
  let count = 0;
  while (true) {
    yield {
      count,
      timestamp: new Date().toISOString(),
    };
    count++;
    await new Promise((resolve) => setTimeout(resolve, input.interval));
  }
});
```

**Key patterns:**
- Use `async function*` (async generator) for the handler
- Use `yield` to emit events to the client
- Use `while (true)` for continuous streams
- Handle cleanup in `finally` blocks if needed
- Access `lastEventId` parameter for resume support

### Client Usage

Subscribe to event iterators using ORPC's `experimental_liveOptions` with TanStack Query:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { orpc } from '@/lib/api-client';

function Component() {
  const [messages, setMessages] = useState([]);

  // Use experimental_liveOptions for event iterators
  const { data } = useQuery({
    ...orpc.subscriptions.counter.experimental_liveOptions({
      input: { interval: 1000 },
    }),
    enabled: true, // Control subscription
    refetchInterval: false,
  });

  // Accumulate messages as they arrive
  useEffect(() => {
    if (data) {
      setMessages((prev) => [...prev, data]);
    }
  }, [data]);

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>Count: {msg.count}</div>
      ))}
    </div>
  );
}
```

**Key Points:**
- Use `experimental_liveOptions()` to wrap event iterators for TanStack Query
- `data` contains the latest event from the stream
- Control subscription with the `enabled` flag
- TanStack Query handles caching, deduplication, and cleanup automatically

### Event Iterator Features

**Resume Support**: Event iterators support automatic resume via `lastEventId`:

```typescript
const handler = publicRoute.example.handler(async function* ({ input, lastEventId }) {
  // Resume from last event if reconnecting
  if (lastEventId) {
    // Skip to last event and continue
  }

  while (true) {
    yield withEventMeta(
      { message: 'Hello' },
      { id: 'unique-id', retry: 10000 }
    );
  }
});
```

**Cleanup**: Use finally blocks for cleanup when streams end:

```typescript
const handler = publicRoute.example.handler(async function* ({ input }) {
  try {
    while (true) {
      yield { data: 'example' };
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } finally {
    // Clean up resources (unsubscribe from Redis, close connections, etc.)
    console.log('Stream ended, cleaning up...');
  }
});
```

### Common Use Cases

**1. Real-time counter/metrics:**
```typescript
// Contract
export const metricsStream = oc
  .output(eventIterator(z.object({ cpu: z.number(), memory: z.number() })));

// Server
const metrics = publicRoute.metricsStream.handler(async function* () {
  while (true) {
    yield { cpu: getCpuUsage(), memory: getMemoryUsage() };
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});
```

**2. Chat messages (with pub/sub):**
```typescript
// Contract
export const chatStream = oc
  .input(z.object({ roomId: z.string() }))
  .output(eventIterator(z.object({ id: z.string(), message: z.string() })));

// Server (with Redis pub/sub)
const chat = publicRoute.chatStream.handler(async function* ({ input }) {
  const channel = `room:${input.roomId}`;

  try {
    for await (const message of subscribeToRedis(channel)) {
      yield message;
    }
  } finally {
    await unsubscribeFromRedis(channel);
  }
});
```

**3. AI streaming responses:**
```typescript
// Contract
export const aiStream = oc
  .input(z.object({ prompt: z.string() }))
  .output(eventIterator(z.object({ token: z.string() })));

// Server
const ai = publicRoute.aiStream.handler(async function* ({ input }) {
  const stream = await openai.chat.completions.create({
    messages: [{ role: 'user', content: input.prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) yield { token };
  }
});
```

### Best Practices

1. **Always use `eventIterator()` in contracts** - This is required for streaming endpoints
2. **Implement cleanup** - Use finally blocks to clean up resources when streams end
3. **Handle errors** - Wrap generators in try/catch for proper error handling
4. **Limit stream lifetime** - Implement timeouts or max event counts for long-running streams
5. **Use lastEventId** - Support resume for better UX on reconnections
6. **Monitor memory** - Be cautious with infinite loops and ensure proper cleanup
7. **Type safety** - Let ORPC infer types from contracts automatically

### Global Notification System

The web template includes a pre-configured real-time notification system using ORPC event iterators and Sonner toasts.

**Implementation pattern:**

1. **NotificationSubscriber component** (`src/components/NotificationSubscriber.tsx`):
   - Subscribes to `orpc.subscriptions.notifications` on mount
   - Displays incoming notifications as toasts based on type (success, error, warning, info)
   - Automatically cleans up subscription on unmount
   - Returns null (doesn't render anything)

2. **Root integration** (`src/routes/__root.tsx`):
   - Renders `<Toaster position="top-right" richColors closeButton />` from Sonner
   - Renders `<NotificationSubscriber />` to establish the subscription
   - Both are placed at the root level so they persist across route changes

**Example usage:**

```typescript
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orpc } from '@/lib/api-client';

export function NotificationSubscriber() {
  // Subscribe using experimental_liveOptions
  const { data: notification } = useQuery({
    ...orpc.subscriptions.notifications.experimental_liveOptions({
      input: {},
    }),
    enabled: typeof window !== 'undefined',
    refetchInterval: false,
    retry: true,
  });

  // Display toast when notification arrives
  useEffect(() => {
    if (!notification) return;

    toast[notification.type](notification.message, {
      description: new Date(notification.timestamp).toLocaleTimeString(),
    });
  }, [notification]);

  return null;
}
```

This pattern is ideal for:
- App-wide notifications
- Real-time system alerts
- Background task updates
- User-specific notifications (with authentication middleware)

### Resources

- [ORPC Event Iterator Documentation](https://orpc.dev/docs/event-iterator)
- [ORPC OpenAI Streaming Example](https://orpc.dev/docs/examples/openai-streaming)
- [ORPC Durable Iterator Integration](https://orpc.dev/docs/integrations/durable-iterator)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)
