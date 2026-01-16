# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A CLI tool for generating monorepo projects from pre-created templates. The tool discovers available templates in the `templates/` directory, lets users multi-select which ones to include, and scaffolds a complete monorepo structure with build orchestration (Turborepo/Nx) and optional features like ESLint, Prettier, Changesets, and GitHub Actions.

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
   - Build tool selection (Turborepo, Nx, or none)
   - TypeScript preference
   - Features (ESLint, Prettier, Changesets, Husky, GitHub Actions, Docker)

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
- `createRootStructure()`: Sets up root package.json, workspace config (pnpm-workspace.yaml), build tool config (turbo.json/nx.json), .gitignore, and README
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

### Package Manager
- Only supports `pnpm` (hardcoded in options)
- Uses `pnpm-workspace.yaml` for workspace configuration

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
