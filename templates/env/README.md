# @workspace/env

Type-safe environment variable management with Zod validation for your monorepo.

## Features

- **Type Safety**: Full TypeScript support with inferred types from Zod schemas
- **Runtime Validation**: Validates environment variables at runtime with helpful error messages
- **Separation of Concerns**: Separate schemas for server-only, client-safe, and shared variables
- **Caching**: Environment variables are validated once and cached for performance
- **Zero Config**: Works out of the box with sensible defaults

## Installation

This package is already installed as part of your monorepo. Just import and use it!

## Usage

### Server-Only Variables

Use this for sensitive data that should NEVER be exposed to the client (API keys, database URLs, secrets).

```typescript
import { useServerEnv } from "@workspace/env/server";

// In your server code (Hono, Express, etc.)
const env = useServerEnv();

console.log(env.DATABASE_URL); // Fully typed!
console.log(env.JWT_SECRET);
console.log(env.PORT); // number type, defaults to 3000
```

### Client-Safe Variables

Use this for public data that can be safely exposed to the browser.

```typescript
import { useClientEnv } from "@workspace/env/client";

// In your client code (React, Vue, etc.)
const env = useClientEnv();

console.log(env.VITE_API_URL); // Fully typed!
console.log(env.VITE_STRIPE_PUBLISHABLE_KEY);
console.log(env.VITE_ENABLE_ANALYTICS); // boolean type
```

### Shared Variables

Use this for non-sensitive data that can be used in both contexts.

```typescript
import { useSharedEnv } from "@workspace/env/shared";

// Works in both server and client
const env = useSharedEnv();

console.log(env.APP_NAME); // Fully typed!
console.log(env.NODE_ENV); // "development" | "production" | "test"
```

## Environment File Setup

Create a `.env` file in your app root:

```bash
# Server-only variables (never exposed to client)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key
PORT=3000

# Client-safe variables (safe to expose)
VITE_API_URL=https://api.example.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_ENABLE_ANALYTICS=true

# Shared variables
APP_NAME=My Awesome App
NODE_ENV=development
```

## Customizing Schemas

Edit the schema files to add your own environment variables:

### `src/server.ts`
Add server-only variables here (database URLs, API secrets, etc.)

### `src/client.ts`
Add client-safe variables here (public API keys, feature flags, etc.)

### `src/shared.ts`
Add shared variables here (app name, non-sensitive config, etc.)

## Example: Adding a New Variable

1. Add to the appropriate schema:

```typescript
// src/server.ts
const serverSchema = z.object({
  // ... existing fields
  SENDGRID_API_KEY: z.string(), // Required field
  REDIS_URL: z.string().url().optional(), // Optional field
});
```

2. Use it in your code:

```typescript
import { useServerEnv } from "@workspace/env/server";

const env = useServerEnv();
// TypeScript knows about SENDGRID_API_KEY and REDIS_URL!
```

## Error Handling

If validation fails, the package will throw an error with detailed information:

```
❌ Invalid server environment variables: {
  DATABASE_URL: ['Invalid url'],
  PORT: ['Expected number, received nan']
}
Error: Invalid server environment variables
```

## Best Practices

1. **Never commit `.env` files** - Add them to `.gitignore`
2. **Use `.env.example`** - Create a template with dummy values
3. **Validate early** - Call `useServerEnv()` at app startup to fail fast
4. **Prefix client vars** - Use `VITE_` prefix for variables exposed to the browser
5. **Keep secrets server-side** - Never put sensitive data in client variables

## Type Exports

You can also import the types directly:

```typescript
import type { ServerEnv } from "@workspace/env/server";
import type { ClientEnv } from "@workspace/env/client";
import type { SharedEnv } from "@workspace/env/shared";

function doSomething(env: ServerEnv) {
  // ...
}
```
