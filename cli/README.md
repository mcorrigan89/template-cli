# create-my-template

A CLI tool to quickly scaffold production-ready TypeScript monorepos with pnpm workspaces.

## Features

- 🚀 **Interactive CLI** - Select templates and features via prompts
- 📦 **Pre-configured Templates**:
  - **Web** - TanStack Start app with Vite, React 19, and Tailwind CSS
  - **Server** - Hono API server with TypeScript
  - **Database** - Drizzle ORM with PostgreSQL
  - **Contract** - oRPC contract definitions for type-safe APIs
- 🔧 **Optional Features**:
  - ESLint & Prettier
  - Changesets (versioning)
  - Husky (git hooks)
  - GitHub Actions CI/CD
- 🐳 **Docker Support** - Automatic docker-compose setup with migrations
- 📝 **TypeScript** - Full TypeScript support across all templates

## Usage

### With pnpm (recommended)

```bash
pnpm create my-template
```

### With npm

```bash
npm create my-template
```

### With npx

```bash
npx create-my-template
```

## What You Get

After running the CLI, you'll have a fully configured monorepo with:

- **Root `package.json`** with scripts to run, build, lint, and test all workspaces
- **Docker Compose** setup (if apps are selected) with automatic database migrations
- **pnpm workspace** configuration
- **Selected templates** in `apps/` or `packages/` directories
- **Git-ready** with `.gitignore`

## Development Commands

Once your monorepo is created:

```bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

# Run specific app
pnpm dev:web
pnpm dev:server

# Build all packages
pnpm build

# Start with Docker
pnpm docker:up
pnpm docker:up:build
```

## Templates

### Web App
- TanStack Start (SSR React framework)
- React 19 with React Compiler
- Tailwind CSS v4
- TanStack Router & Query
- Vite build system
- Docker support

### Server App
- Hono web framework
- oRPC for type-safe APIs
- TypeScript with tsup bundler
- Docker support

### Database Package
- Drizzle ORM
- PostgreSQL support
- Automatic migrations in Docker
- Type-safe schema

### Contract Package
- oRPC contract definitions
- Shared types between client and server

## Requirements

- Node.js 22+
- pnpm 10+

## License

MIT
