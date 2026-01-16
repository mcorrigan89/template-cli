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
        description: entry.name
      };

      // Read template.json if it exists
      if (await fs.pathExists(metadataPath)) {
        try {
          const fileContent = await fs.readJson(metadataPath);
          metadata = {
            name: fileContent.name || entry.name,
            type: fileContent.type || 'package',
            description: fileContent.description || entry.name
          };
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Warning: Invalid template.json in ${entry.name}, using defaults`));
        }
      }

      templates.push({
        ...metadata,
        path: templatePath
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
}

interface MonorepoOptions {
  monorepoName: string;
  workspacePrefix: string;
  packageManager: 'pnpm';
  buildTool: 'turborepo' | 'nx' | 'none';
  typescript: boolean;
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
    // {
    //   type: 'select',
    //   name: 'packageManager',
    //   message: 'Package manager:',
    //   choices: [
    //     { title: 'pnpm (recommended for monorepos)', value: 'pnpm' },
    //     { title: 'npm', value: 'npm' },
    //     { title: 'yarn', value: 'yarn' }
    //   ],
    //   initial: 0
    // },
    {
      type: 'select',
      name: 'buildTool',
      message: 'Build orchestration:',
      choices: [
        { title: 'Turborepo (recommended)', value: 'turborepo' },
        { title: 'Nx', value: 'nx' },
        { title: 'None (manual scripts)', value: 'none' }
      ],
      initial: 0
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      initial: true
    },
    {
      type: 'multiselect',
      name: 'features',
      message: 'Select monorepo features:',
      choices: [
        { title: 'ESLint (shared config)', value: 'eslint', selected: true },
        { title: 'Prettier (shared config)', value: 'prettier', selected: true },
        { title: 'Changesets (versioning)', value: 'changesets', selected: true },
        { title: 'Husky (git hooks)', value: 'husky' },
        { title: 'GitHub Actions', value: 'github-actions', selected: true },
        { title: 'Docker', value: 'docker' }
      ]
    }
  ]);

  if (!response.monorepoName) {
    console.log(chalk.red('\n❌ Operation cancelled'));
    process.exit(0);
  }

  // Discover and select templates
  const templatesDir = path.join(__dirname, '..', 'templates');
  const availableTemplates = await discoverTemplates(templatesDir);

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
      selected: false
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

  // Update package.json if it exists
  const pkgJsonPath = path.join(destDir, 'package.json');
  if (await fs.pathExists(pkgJsonPath)) {
    const pkgJson = await fs.readJson(pkgJsonPath);
    pkgJson.name = `${options.workspacePrefix}/${template.name}`;
    await fs.writeJson(pkgJsonPath, pkgJson, { spaces: 2 });
  }
}

async function scaffoldMonorepo(targetDir: string, options: MonorepoOptions): Promise<void> {
  await fs.ensureDir(targetDir);

  const templatesDir = path.join(__dirname, '..', 'templates');

  // Create root structure
  await createRootStructure(targetDir, options);

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
  await addFeatures(targetDir, options, templatesDir);
}

async function createRootStructure(targetDir: string, options: MonorepoOptions): Promise<void> {
  // Create directories
  await fs.ensureDir(path.join(targetDir, 'apps'));
  await fs.ensureDir(path.join(targetDir, 'packages'));

  // Root package.json
  const rootPackageJson: PackageJson = {
    name: options.monorepoName,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'echo "Select dev script based on build tool"',
      build: 'echo "Select build script based on build tool"',
      lint: 'echo "Select lint script based on build tool"',
      test: 'echo "Select test script based on build tool"'
    },
    devDependencies: {}
  };

  // Configure based on package manager
  if (options.packageManager === 'pnpm') {
    // pnpm-workspace.yaml
    await fs.writeFile(
      path.join(targetDir, 'pnpm-workspace.yaml'),
      `packages:\n  - 'apps/*'\n  - 'packages/*'\n`
    );
  } else if (options.packageManager === 'npm' || options.packageManager === 'yarn') {
    rootPackageJson.workspaces = ['apps/*', 'packages/*'];
  }

  // Configure build tool
  if (options.buildTool === 'turborepo') {
    rootPackageJson.scripts = {
      dev: 'turbo run dev',
      build: 'turbo run build',
      lint: 'turbo run lint',
      test: 'turbo run test',
      clean: 'turbo run clean'
    };
    rootPackageJson.devDependencies!.turbo = '^1.11.0';

    // turbo.json
    const turboConfig = {
      $schema: 'https://turbo.build/schema.json',
      globalDependencies: ['**/.env.*local'],
      pipeline: {
        build: {
          dependsOn: ['^build'],
          outputs: ['dist/**', '.next/**', 'build/**']
        },
        dev: {
          cache: false,
          persistent: true
        },
        lint: {
          dependsOn: ['^lint']
        },
        test: {
          dependsOn: ['^build']
        },
        clean: {
          cache: false
        }
      }
    };
    await fs.writeJson(path.join(targetDir, 'turbo.json'), turboConfig, { spaces: 2 });

  } else if (options.buildTool === 'nx') {
    rootPackageJson.scripts = {
      dev: 'nx run-many --target=dev --all',
      build: 'nx run-many --target=build --all',
      lint: 'nx run-many --target=lint --all',
      test: 'nx run-many --target=test --all'
    };
    rootPackageJson.devDependencies!.nx = '^17.0.0';
    
    // nx.json
    const nxConfig = {
      extends: 'nx/presets/npm.json',
      tasksRunnerOptions: {
        default: {
          runner: 'nx/tasks-runners/default',
          options: {
            cacheableOperations: ['build', 'lint', 'test']
          }
        }
      }
    };
    await fs.writeJson(path.join(targetDir, 'nx.json'), nxConfig, { spaces: 2 });
  }

  if (options.typescript) {
    rootPackageJson.devDependencies!.typescript = '^5.3.0';
  }

  await fs.writeJson(path.join(targetDir, 'package.json'), rootPackageJson, { spaces: 2 });

  // .gitignore
  const gitignore = `
node_modules
dist
build
.next
.turbo
.nx
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

## Structure

- \`apps/*\` - Applications
- \`packages/*\` - Shared packages
${templatesSection}
  `.trim();
  await fs.writeFile(path.join(targetDir, 'README.md'), readme);
}

async function addFeatures(targetDir: string, options: MonorepoOptions, templatesDir: string): Promise<void> {
  console.log(chalk.blue('\n🔧 Adding features...'));

  for (const feature of options.features) {
    console.log(chalk.gray(`  Adding ${feature}...`));
    const featurePath = path.join(templatesDir, 'features', feature);
    
    if (await fs.pathExists(featurePath)) {
      await fs.copy(featurePath, targetDir, { overwrite: true });
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
  if (options.buildTool === 'turborepo') {
    console.log(chalk.white('  Turborepo: https://turbo.build/repo/docs'));
  } else if (options.buildTool === 'nx') {
    console.log(chalk.white('  Nx: https://nx.dev'));
  }
  if (options.packageManager === 'pnpm') {
    console.log(chalk.white('  pnpm workspaces: https://pnpm.io/workspaces'));
  }
}

create().catch((error: Error) => {
  console.error(chalk.red('❌ Error:'), error.message);
  process.exit(1);
});
