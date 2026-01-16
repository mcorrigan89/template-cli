#!/usr/bin/env node

import prompts from 'prompts';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Framework = 'react' | 'vue' | 'vanilla' | 'node' | 'next' | 'express';
// type PackageManager = 'pnpm' | 'npm' | 'yarn';

interface MonorepoOptions {
  monorepoName: string;
  workspacePrefix: string;
  packageManager: 'pnpm';
  buildTool: 'turborepo' | 'nx' | 'none';
  typescript: boolean;
  apps: AppConfig[];
  packages: PackageConfig[];
  features: string[];
}

interface AppConfig {
  name: string;
  framework: Framework;
}

interface PackageConfig {
  name: string;
  type: 'ui' | 'utils' | 'config' | 'types';
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

  // Ask about apps
  const apps: AppConfig[] = [];
  let addMoreApps = true;
  
  console.log(chalk.cyan('\n📱 Configure Applications:'));
  
  while (addMoreApps) {
    const appResponse = await prompts([
      {
        type: 'text',
        name: 'name',
        message: `App name (${apps.length + 1}):`,
        initial: apps.length === 0 ? 'web' : ''
      },
      {
        type: (prev: string) => prev ? 'select' : null,
        name: 'framework',
        message: 'Framework:',
        choices: [
          { title: 'Next.js', value: 'next' },
          { title: 'React (Vite)', value: 'react' },
          { title: 'Vue (Vite)', value: 'vue' },
          { title: 'Express API', value: 'express' },
          { title: 'Vanilla', value: 'vanilla' }
        ]
      },
      {
        type: (prev: any, values: any) => values.name ? 'confirm' : null,
        name: 'addMore',
        message: 'Add another app?',
        initial: apps.length === 0
      }
    ]);

    if (appResponse.name) {
      apps.push({ name: appResponse.name, framework: appResponse.framework });
    }
    
    addMoreApps = appResponse.addMore && appResponse.name;
  }

  // Ask about packages
  const packages: PackageConfig[] = [];
  let addMorePackages = true;
  
  console.log(chalk.cyan('\n📦 Configure Packages:'));
  
  const suggestPackages = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Add common packages (ui, utils, tsconfig)?',
    initial: true
  });

  if (suggestPackages.value) {
    packages.push(
      { name: 'ui', type: 'ui' },
      { name: 'utils', type: 'utils' },
      { name: 'tsconfig', type: 'config' }
    );
  } else {
    while (addMorePackages) {
      const pkgResponse = await prompts([
        {
          type: 'text',
          name: 'name',
          message: `Package name (${packages.length + 1}):`,
          initial: ''
        },
        {
          type: (prev: string) => prev ? 'select' : null,
          name: 'type',
          message: 'Package type:',
          choices: [
            { title: 'UI Components', value: 'ui' },
            { title: 'Utilities', value: 'utils' },
            { title: 'Config', value: 'config' },
            { title: 'Types', value: 'types' }
          ]
        },
        {
          type: (prev: any, values: any) => values.name ? 'confirm' : null,
          name: 'addMore',
          message: 'Add another package?',
          initial: false
        }
      ]);

      if (pkgResponse.name) {
        packages.push({ name: pkgResponse.name, type: pkgResponse.type });
      }
      
      addMorePackages = pkgResponse.addMore && pkgResponse.name;
    }
  }

  const options: MonorepoOptions = {
    ...response,
    packageManager: 'pnpm',
    apps,
    packages
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

async function scaffoldMonorepo(targetDir: string, options: MonorepoOptions): Promise<void> {
  await fs.ensureDir(targetDir);

  const templatesDir = path.join(__dirname, '..', 'templates');

  // Create root structure
  await createRootStructure(targetDir, options);
  
  // Create apps
  console.log(chalk.blue('\n📱 Creating applications...'));
  for (const app of options.apps) {
    await createApp(targetDir, app, options, templatesDir);
  }

  // Create packages
  console.log(chalk.blue('\n📦 Creating packages...'));
  for (const pkg of options.packages) {
    await createPackage(targetDir, pkg, options, templatesDir);
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

## Apps

${options.apps.map(app => `- **${app.name}** (${app.framework})`).join('\n')}

## Packages

${options.packages.map(pkg => `- **${pkg.name}** (${pkg.type})`).join('\n')}
  `.trim();
  await fs.writeFile(path.join(targetDir, 'README.md'), readme);
}

async function createApp(
  targetDir: string,
  app: AppConfig,
  options: MonorepoOptions,
  templatesDir: string
): Promise<void> {
  const appDir = path.join(targetDir, 'apps', app.name);
  await fs.ensureDir(appDir);

  console.log(chalk.gray(`  Creating ${app.name} (${app.framework})...`));

  const suffix = options.typescript ? '-ts' : '-js';
  const templatePath = path.join(templatesDir, 'apps', `${app.framework}${suffix}`);

  if (await fs.pathExists(templatePath)) {
    await fs.copy(templatePath, appDir);
  }

  // Generate app package.json
  const appPackageJson = generateAppPackageJson(app, options);
  await fs.writeJson(path.join(appDir, 'package.json'), appPackageJson, { spaces: 2 });

  // Add TypeScript config if needed
  if (options.typescript) {
    const tsConfig = generateTsConfig('app', app.framework, options);
    await fs.writeJson(path.join(appDir, 'tsconfig.json'), tsConfig, { spaces: 2 });
  }
}

async function createPackage(
  targetDir: string,
  pkg: PackageConfig,
  options: MonorepoOptions,
  templatesDir: string
): Promise<void> {
  const pkgDir = path.join(targetDir, 'packages', pkg.name);
  await fs.ensureDir(pkgDir);

  console.log(chalk.gray(`  Creating ${pkg.name} (${pkg.type})...`));

  const suffix = options.typescript ? '-ts' : '-js';
  const templatePath = path.join(templatesDir, 'packages', `${pkg.type}${suffix}`);

  if (await fs.pathExists(templatePath)) {
    await fs.copy(templatePath, pkgDir);
  } else {
    // Create basic structure
    await fs.ensureDir(path.join(pkgDir, 'src'));
    const indexContent = options.typescript 
      ? `export const hello = (): string => 'Hello from ${pkg.name}';\n`
      : `export const hello = () => 'Hello from ${pkg.name}';\n`;
    
    const ext = options.typescript ? 'ts' : 'js';
    await fs.writeFile(path.join(pkgDir, 'src', `index.${ext}`), indexContent);
  }

  // Generate package package.json
  const pkgPackageJson = generatePackagePackageJson(pkg, options);
  await fs.writeJson(path.join(pkgDir, 'package.json'), pkgPackageJson, { spaces: 2 });

  // Add TypeScript config if needed
  if (options.typescript) {
    const tsConfig = generateTsConfig('package', pkg.type, options);
    await fs.writeJson(path.join(pkgDir, 'tsconfig.json'), tsConfig, { spaces: 2 });
  }

  // Add README
  const readme = `# ${options.workspacePrefix}/${pkg.name}\n\n${pkg.type} package\n`;
  await fs.writeFile(path.join(pkgDir, 'README.md'), readme);
}

function generateAppPackageJson(app: AppConfig, options: MonorepoOptions): PackageJson {
  const packageJson: PackageJson = {
    name: `${options.workspacePrefix}/${app.name}`,
    version: '0.1.0',
    private: true,
    scripts: {},
    dependencies: {},
    devDependencies: {}
  };

  switch (app.framework) {
    case 'next':
      packageJson.scripts = {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      };
      packageJson.dependencies = {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      };
      if (options.typescript) {
        packageJson.devDependencies = {
          '@types/node': '^20.10.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          typescript: '^5.3.0'
        };
      }
      break;

    case 'react':
    case 'vue':
    case 'vanilla':
      packageJson.type = 'module';
      packageJson.scripts = {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      };
      packageJson.devDependencies = { vite: '^5.0.0' };
      
      if (app.framework === 'react') {
        packageJson.dependencies = {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        };
        packageJson.devDependencies['@vitejs/plugin-react'] = '^4.2.0';
        if (options.typescript) {
          packageJson.devDependencies['@types/react'] = '^18.2.0';
          packageJson.devDependencies['@types/react-dom'] = '^18.2.0';
        }
      } else if (app.framework === 'vue') {
        packageJson.dependencies = { vue: '^3.3.0' };
        packageJson.devDependencies['@vitejs/plugin-vue'] = '^5.0.0';
      }
      break;

    case 'express':
      packageJson.type = 'module';
      packageJson.scripts = {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js'
      };
      packageJson.dependencies = { express: '^4.18.0' };
      packageJson.devDependencies = {
        tsx: '^4.7.0',
        '@types/express': '^4.17.0',
        '@types/node': '^20.10.0'
      };
      break;
  }

  return packageJson;
}

function generatePackagePackageJson(pkg: PackageConfig, options: MonorepoOptions): PackageJson {
  const packageJson: PackageJson = {
    name: `${options.workspacePrefix}/${pkg.name}`,
    version: '0.1.0',
    private: false,
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        import: './dist/index.js',
        require: './dist/index.cjs',
        types: './dist/index.d.ts'
      }
    },
    scripts: {
      build: 'tsup',
      dev: 'tsup --watch'
    },
    devDependencies: {
      tsup: '^8.0.0'
    }
  };

  if (pkg.type === 'ui') {
    packageJson.peerDependencies = {
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    };
  }

  return packageJson;
}

function generateTsConfig(type: 'app' | 'package', framework: string, options: MonorepoOptions): any {
  const baseConfig = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ['src'],
    exclude: ['node_modules', 'dist']
  };

  if (type === 'package') {
    baseConfig.compilerOptions.noEmit = false;
    // baseConfig.compilerOptions.declaration = true;
    // baseConfig.compilerOptions.outDir = 'dist';
  }

  if (framework === 'next') {
    return {
      extends: 'next/core-web-vitals',
      compilerOptions: {
        ...baseConfig.compilerOptions,
        noEmit: true
      }
    };
  }

  return baseConfig;
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
