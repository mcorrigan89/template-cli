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
  - `templates/orpc-contract/`: Package template with ESLint, Prettier configs
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
- Package templates (like orpc-contract) don't include Docker files
- Multi-stage production builds with pnpm
- Security best practices (non-root user, minimal Alpine images)
- Each template can customize its Docker configuration independently
