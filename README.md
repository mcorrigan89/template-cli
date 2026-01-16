# create-my-template

A CLI tool to quickly scaffold production-ready TypeScript monorepos with pnpm workspaces.

## 🚀 Quick Start

### Run directly from GitHub

```bash
# Using pnpm (recommended)
pnpm dlx github:yourusername/template-cli

# Using npx
npx github:yourusername/template-cli
```

### Or install globally

```bash
# Clone and install
git clone https://github.com/yourusername/template-cli.git
cd template-cli
pnpm install
pnpm build

# Run it
node bin/index.js
```

## ✨ Features

- 🚀 **Interactive CLI** - Select templates and features via prompts
- 📦 **Pre-configured Templates**:
  - **Web** - TanStack Start app with Vite, React 19, and Tailwind CSS
  - **Server** - Hono API server with TypeScript and tsup
  - **Database** - Drizzle ORM with PostgreSQL and migrations
  - **Contract** - oRPC contract definitions for type-safe APIs
- 🔧 **Optional Features**:
  - ESLint & Prettier
  - Changesets (versioning)
  - Husky (git hooks)
  - GitHub Actions CI/CD
- 🐳 **Docker Support** - Automatic docker-compose setup with database migrations
- 📝 **TypeScript** - Full TypeScript support across all templates

## 📦 What You Get

After running the CLI, you'll have a fully configured monorepo with:

- **Root `package.json`** with smart scripts:
  - `pnpm dev` - Runs all apps in parallel
  - `pnpm dev:web` - Run only web app
  - `pnpm dev:server` - Run only server app
  - `pnpm build` - Build all workspaces
  - `pnpm docker:up` - Start all services with Docker
- **Docker Compose** setup with:
  - PostgreSQL database (if database template selected)
  - Automatic migrations on startup
  - All apps containerized and networked
- **pnpm workspace** configuration
- **Selected templates** in `apps/` or `packages/` directories
- **Git-ready** with `.gitignore`

## 🛠️ Development Commands

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

# Start with Docker (includes database + migrations)
pnpm docker:up
pnpm docker:up:build  # Rebuild images
pnpm docker:down      # Stop all services
pnpm docker:logs      # View logs
```

## 📁 Templates

### Web App (`apps/web/`)
- **TanStack Start** (SSR React framework)
- **React 19** with React Compiler
- **Tailwind CSS v4** with modern design system
- **TanStack Router** for file-based routing
- **TanStack Query** for data fetching
- **Vite** build system
- **Docker** ready with multi-stage builds

### Server App (`apps/server/`)
- **Hono** lightweight web framework
- **oRPC** for type-safe APIs
- **TypeScript** with tsup bundler
- **Pino** structured logging
- **Docker** ready with production builds

### Database Package (`packages/database/`)
- **Drizzle ORM** for type-safe SQL
- **PostgreSQL** support
- **Automatic migrations** in Docker
- **Migration Dockerfile** for production

### Contract Package (`packages/contract/`)
- **oRPC** contract definitions
- **Shared types** between client and server
- **Full type safety** across the stack

## 🐳 Docker Architecture

When database is selected, the generated `docker-compose.yml` includes:

1. **PostgreSQL** - Database with health checks
2. **Migrate** - Runs migrations automatically on startup
3. **Server** - Waits for migrations to complete
4. **Web** - Waits for server and database

Services are networked and dependencies are handled automatically.

## 📋 Requirements

- **Node.js** 22+
- **pnpm** 10+
- **Docker** (optional, for containerized development)

## 🔧 Customization

After scaffolding, you can customize:
- Add more templates to `apps/` or `packages/`
- Modify Docker configurations per template
- Update root scripts in `package.json`
- Configure ESLint/Prettier rules per workspace

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 🔗 Links

- [TanStack Start](https://tanstack.com/start)
- [Hono](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [oRPC](https://orpc.io/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
