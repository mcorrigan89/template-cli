#!/usr/bin/env node

import prompts from 'prompts';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function discoverTemplates(templatesDir: string): Promise<TemplateInfo[]> {
  const templates: TemplateInfo[] = [];
  const ignoreDirs = ['base', 'features'];

  try {
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || ignoreDirs.includes(entry.name)) {
        continue;
      }

      const templatePath = path.join(templatesDir, entry.name);
      const metadataPath = path.join(templatePath, 'template.json');

      // Default metadata if template.json doesn't exist
      let metadata = {
        name: entry.name,
        type: 'package' as const,
        description: entry.name,
        default: false
      };

      // Read template.json if it exists
      if (await fs.pathExists(metadataPath)) {
        try {
          const fileContent = await fs.readJson(metadataPath);
          metadata = {
            name: fileContent.name || entry.name,
            type: fileContent.type || 'package',
            description: fileContent.description || entry.name,
            default: fileContent.default || false
          };
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Warning: Invalid template.json in ${entry.name}, using defaults`));
        }
      }

      templates.push({
        ...metadata,
        path: templatePath,
      });
    }
  } catch (error) {
    console.log(chalk.red('Error discovering templates:'), error);
  }

  return templates;
}

interface TemplateInfo {
  name: string;
  type: 'app' | 'package';
  description: string;
  path: string;
  default: boolean;
}

interface MonorepoOptions {
  monorepoName: string;
  workspacePrefix: string;
  packageManager: 'pnpm';
  selectedTemplates: TemplateInfo[];
  features: string[];
}

interface PackageJson {
  name: string;
  version: string;
  type?: string;
  private?: boolean;
  main?: string;
  types?: string;
  exports?: Record<string, any>;
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[];
}

async function create(): Promise<void> {
  console.log(chalk.blue('🚀 Monorepo Template Generator\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'monorepoName',
      message: 'Monorepo name:',
      initial: 'my-monorepo',
      validate: (value: string) => 
        value.length > 0 ? true : 'Monorepo name is required'
    },
    {
      type: 'text',
      name: 'workspacePrefix',
      message: 'Workspace prefix (e.g., @my-org):',
      initial: '@my-org',
      validate: (value: string) => 
        value.startsWith('@') ? true : 'Prefix should start with @'
    },
    {
      type: 'multiselect',
      name: 'features',
      message: 'Select monorepo features:',
      choices: [
        { title: 'ESLint', value: 'eslint', selected: true },
        { title: 'Prettier', value: 'prettier', selected: true },
        { title: 'Changesets (versioning)', value: 'changesets', selected: true },
        { title: 'Husky (git hooks)', value: 'husky' },
        { title: 'GitHub Actions', value: 'github-actions', selected: true }
      ]
    }
  ]);

  if (!response.monorepoName) {
    console.log(chalk.red('\n❌ Operation cancelled'));
    process.exit(0);
  }

  // Discover and select templates
  // In dev (monorepo): read from ../../templates (root level)
  // In dist (published): read from ../templates (cli/templates)
  const templatesDir = path.join(__dirname, '..', 'templates');
  const devTemplatesDir = path.join(__dirname, '..', '..', 'templates');

  // Use dev templates if they exist (monorepo mode), otherwise use dist templates
  const finalTemplatesDir = await fs.pathExists(devTemplatesDir) ? devTemplatesDir : templatesDir;
  const availableTemplates = await discoverTemplates(finalTemplatesDir);

  if (availableTemplates.length === 0) {
    console.log(chalk.yellow('\n⚠️  No templates found in templates/ directory'));
    console.log(chalk.gray('Create template directories in templates/ with template.json files'));
    process.exit(1);
  }

  console.log(chalk.cyan('\n📦 Select Templates:'));

  const templateSelection = await prompts({
    type: 'multiselect',
    name: 'selectedTemplates',
    message: 'Select templates to include:',
    choices: availableTemplates.map(t => ({
      title: `${t.name} (${t.type})`,
      description: t.description,
      value: t,
      selected: t.default || false
    })),
    min: 0
  });

  if (templateSelection.selectedTemplates === undefined) {
    console.log(chalk.red('\n❌ Operation cancelled'));
    process.exit(0);
  }

  const options: MonorepoOptions = {
    ...response,
    packageManager: 'pnpm',
    selectedTemplates: templateSelection.selectedTemplates || []
  };

  const targetDir = path.join(process.cwd(), options.monorepoName);

  if (await fs.pathExists(targetDir)) {
    const overwrite = await prompts({
      type: 'confirm',
      name: 'value',
      message: `Directory ${options.monorepoName} already exists. Overwrite?`,
      initial: false
    });
    
    if (!overwrite.value) {
      process.exit(0);
    }
    await fs.remove(targetDir);
  }

  console.log(chalk.green(`\n📦 Creating monorepo in ${targetDir}...`));

  await scaffoldMonorepo(targetDir, options);

  console.log(chalk.green('\n✨ Monorepo created successfully!\n'));
  printNextSteps(options);
}

async function createFromTemplate(
  targetDir: string,
  template: TemplateInfo,
  options: MonorepoOptions
): Promise<void> {
  // Determine destination directory based on template type
  const destType = template.type === 'app' ? 'apps' : 'packages';
  const destDir = path.join(targetDir, destType, template.name);

  console.log(chalk.gray(`  Creating ${template.name} (${template.type})...`));

  // Copy template directory to destination
  await fs.ensureDir(destDir);
  await fs.copy(template.path, destDir, {
    filter: (src: string) => {
      // Don't copy template.json metadata file
      return !src.endsWith('template.json');
    }
  });

  // Replace @workspace/ references in all text files
  await replaceWorkspaceReferences(destDir, options.workspacePrefix);
}

async function replaceWorkspaceReferences(dir: string, workspacePrefix: string): Promise<void> {
  const textFileExtensions = ['.json', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md'];

  async function processDirectory(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other unnecessary directories
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        // Check if file has a text extension
        const ext = path.extname(entry.name);
        if (textFileExtensions.includes(ext)) {
          try {
            let content = await fs.readFile(fullPath, 'utf-8');
            // Replace both @workspace/ (dist mode) and @template/ (dev mode)
            const updated = content
              .replace(/@workspace\//g, `${workspacePrefix}/`)
              .replace(/@template\//g, `${workspacePrefix}/`);

            // Only write if content changed
            if (updated !== content) {
              await fs.writeFile(fullPath, updated, 'utf-8');
            }
          } catch (error) {
            // Skip binary files or files that can't be read as text
            console.log(chalk.yellow(`    Skipping ${entry.name} (not a text file)`));
          }
        }
      }
    }
  }

  await processDirectory(dir);
}

async function scaffoldMonorepo(targetDir: string, options: MonorepoOptions): Promise<void> {
  await fs.ensureDir(targetDir);

  // In dev (monorepo): read from ../../templates (root level)
  // In dist (published): read from ../templates (cli/templates)
  const templatesDir = path.join(__dirname, '..', 'templates');
  const devTemplatesDir = path.join(__dirname, '..', '..', 'templates');
  const finalTemplatesDir = await fs.pathExists(devTemplatesDir) ? devTemplatesDir : templatesDir;

  // Create root structure
  await createRootStructure(targetDir, options, finalTemplatesDir);

  // Create from templates
  if (options.selectedTemplates.length > 0) {
    console.log(chalk.blue('\n📦 Creating from templates...'));
    for (const template of options.selectedTemplates) {
      await createFromTemplate(targetDir, template, options);
    }
  } else {
    console.log(chalk.yellow('\n⚠️  No templates selected, creating empty monorepo structure'));
  }

  // Add feature configurations
  await addFeatures(targetDir, options, finalTemplatesDir);
}

async function createRootStructure(targetDir: string, options: MonorepoOptions, templatesDir: string): Promise<void> {
  // Create directories
  await fs.ensureDir(path.join(targetDir, 'apps'));
  await fs.ensureDir(path.join(targetDir, 'packages'));

  // Root package.json
  const hasAppTemplates = options.selectedTemplates.some(t => t.type === 'app');
  const rootPackageJson: PackageJson = {
    name: options.monorepoName,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'pnpm run --parallel dev',
      build: 'pnpm run -r build',
      lint: 'pnpm run -r lint',
      test: 'pnpm run -r test',
      clean: 'pnpm run -r clean',
      ...(hasAppTemplates && {
        'docker:up': 'docker-compose up',
        'docker:up:build': 'docker-compose up --build',
        'docker:down': 'docker-compose down',
        'docker:logs': 'docker-compose logs -f'
      })
    },
    devDependencies: {
      typescript: '^5.3.0'
    }
  };

  // pnpm-workspace.yaml
  await fs.writeFile(
    path.join(targetDir, 'pnpm-workspace.yaml'),
    `packages:\n  - 'apps/*'\n  - 'packages/*'\n`
  );

  await fs.writeJson(path.join(targetDir, 'package.json'), rootPackageJson, { spaces: 2 });

  // Copy root-level docker-compose.yml if any app templates are selected
  if (hasAppTemplates) {
    const dockerComposeSource = path.join(templatesDir, 'base', 'docker-compose.yml');
    if (await fs.pathExists(dockerComposeSource)) {
      console.log(chalk.gray('  Adding root docker-compose.yml...'));
      await fs.copy(dockerComposeSource, path.join(targetDir, 'docker-compose.yml'));
    }
  }

  // .gitignore
  const gitignore = `
node_modules
dist
build
.next
*.log
.env*.local
.DS_Store
coverage
  `.trim();
  await fs.writeFile(path.join(targetDir, '.gitignore'), gitignore);

  // README.md
  const templatesSection = options.selectedTemplates.length > 0
    ? `\n## Selected Templates\n\n${options.selectedTemplates.map(t => `- **${t.name}** (${t.type}): ${t.description}`).join('\n')}`
    : '';

  const dockerSection = hasAppTemplates
    ? `

## Docker

Run all apps with Docker Compose:

\`\`\`bash
# Start all services
${options.packageManager} run docker:up

# Start with rebuild
${options.packageManager} run docker:up:build

# Stop all services
${options.packageManager} run docker:down

# View logs
${options.packageManager} run docker:logs
\`\`\``
    : '';

  const readme = `
# ${options.monorepoName}

## Getting Started

\`\`\`bash
# Install dependencies
${options.packageManager} install

# Run development
${options.packageManager} run dev

# Build all
${options.packageManager} run build
\`\`\`
${dockerSection}

## Structure

- \`apps/*\` - Applications
- \`packages/*\` - Shared packages
${templatesSection}
  `.trim();
  await fs.writeFile(path.join(targetDir, 'README.md'), readme);
}

async function addFeatures(targetDir: string, options: MonorepoOptions, templatesDir: string): Promise<void> {
  if (options.features.length === 0) {
    return;
  }

  console.log(chalk.blue('\n🔧 Adding features...'));

  // Read the root package.json to add dependencies
  const pkgJsonPath = path.join(targetDir, 'package.json');
  const rootPackageJson = await fs.readJson(pkgJsonPath);

  // Feature dependencies map (for root devDependencies)
  const featureDeps: Record<string, Record<string, string>> = {
    eslint: {
      eslint: '^8.57.0',
      '@typescript-eslint/parser': '^6.21.0',
      '@typescript-eslint/eslint-plugin': '^6.21.0'
    },
    prettier: {
      prettier: '^3.2.0'
    },
    changesets: {
      '@changesets/cli': '^2.27.0'
    },
    husky: {
      husky: '^9.0.0'
    }
  };

  // Feature scripts map
  const featureScripts: Record<string, Record<string, string>> = {
    eslint: {
      lint: 'pnpm run -r lint',
      'lint:fix': 'pnpm run -r lint:fix'
    },
    prettier: {
      format: 'pnpm run -r format',
      'format:check': 'pnpm run -r format:check'
    },
    husky: {
      prepare: 'husky install'
    }
  };

  for (const feature of options.features) {
    console.log(chalk.gray(`  Adding ${feature}...`));
    const featurePath = path.join(templatesDir, 'features', feature);

    // Copy feature files to root (husky, github-actions, etc.)
    if (await fs.pathExists(featurePath)) {
      await fs.copy(featurePath, targetDir, { overwrite: true });
    }

    // Add dependencies for this feature
    if (featureDeps[feature]) {
      rootPackageJson.devDependencies = {
        ...rootPackageJson.devDependencies,
        ...featureDeps[feature]
      };
    }

    // Add scripts for this feature
    if (featureScripts[feature]) {
      rootPackageJson.scripts = {
        ...rootPackageJson.scripts,
        ...featureScripts[feature]
      };
    }
  }

  // Add changesets if selected
  if (options.features.includes('changesets')) {
    await fs.ensureDir(path.join(targetDir, '.changeset'));
    const changesetConfig = {
      $schema: 'https://unpkg.com/@changesets/config@2.3.0/schema.json',
      changelog: '@changesets/cli/changelog',
      commit: false,
      fixed: [],
      linked: [],
      access: 'public',
      baseBranch: 'main',
      updateInternalDependencies: 'patch',
      ignore: []
    };
    await fs.writeJson(path.join(targetDir, '.changeset', 'config.json'), changesetConfig, { spaces: 2 });
  }

  // Update root package.json with new dependencies and scripts
  await fs.writeJson(pkgJsonPath, rootPackageJson, { spaces: 2 });
}

function printNextSteps(options: MonorepoOptions): void {
  console.log(chalk.cyan('📝 Next steps:\n'));
  console.log(chalk.white(`  cd ${options.monorepoName}`));
  console.log(chalk.white(`  ${options.packageManager} install`));
  console.log(chalk.white(`  ${options.packageManager} run dev\n`));

  if (options.features.includes('changesets')) {
    console.log(chalk.gray('💡 To create a changeset:'));
    console.log(chalk.white(`  ${options.packageManager} changeset\n`));
  }

  console.log(chalk.gray('📚 Documentation:'));
  console.log(chalk.white('  pnpm workspaces: https://pnpm.io/workspaces'));
}

create().catch((error: Error) => {
  console.error(chalk.red('❌ Error:'), error.message);
  process.exit(1);
});
