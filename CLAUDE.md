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
   - Features (ESLint, Prettier, Changesets, Husky, GitHub Actions, Docker)
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
- `createFromTemplate()`: Copies a template to the appropriate directory (apps/ or packages/) and updates package.json name
- `createRootStructure()`: Sets up root package.json with pnpm scripts, pnpm-workspace.yaml, .gitignore, and README
- `scaffoldMonorepo()`: Orchestrates the monorepo creation by calling the above functions
- `addFeatures()`: Copies feature configurations from `templates/features/*` and initializes changesets

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
   - Should include `package.json` (name will be updated with workspace prefix)
   - Can include any files/folders needed for the project
   - `template.json` itself is not copied to the output

### Templates Directory

The `templates/` directory is copied alongside the built CLI during distribution:
- `templates/base/`: Base configuration files (pnpm-workspace.yaml, .prettierignore)
- `templates/{name}/`: Individual templates with `template.json` metadata
  - `templates/web/`: Example app template
  - `templates/server/`: Example app template
  - `templates/orpc-contract/`: Example package template
- `templates/features/`: Feature configurations (eslint, prettier, changesets, etc.)

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
- The CLI reads the template's `package.json`
- Updates the `name` field to `${workspacePrefix}/${templateName}`
- Preserves all other fields from the template

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
