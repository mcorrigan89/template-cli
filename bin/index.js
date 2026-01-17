#!/usr/bin/env node
import prompts from 'prompts';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { spawn } from 'child_process';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function discoverTemplates(templatesDir) {
    const templates = [];
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
                type: 'package',
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
                }
                catch (error) {
                    console.log(chalk.yellow(`⚠️  Warning: Invalid template.json in ${entry.name}, using defaults`));
                }
            }
            templates.push({
                ...metadata,
                path: templatePath,
            });
        }
    }
    catch (error) {
        console.log(chalk.red('Error discovering templates:'), error);
    }
    return templates;
}
async function create() {
    console.log(chalk.blue('🚀 Monorepo Template Generator\n'));
    const response = await prompts([
        {
            type: 'text',
            name: 'monorepoName',
            message: 'Monorepo name:',
            initial: 'my-monorepo',
            validate: (value) => value.length > 0 ? true : 'Monorepo name is required'
        },
        {
            type: 'text',
            name: 'workspacePrefix',
            message: 'Workspace prefix (e.g., @my-org):',
            initial: '@my-org',
            validate: (value) => value.startsWith('@') ? true : 'Prefix should start with @'
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
    const options = {
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
    // Install dependencies
    try {
        await installDependencies(targetDir);
    }
    catch (error) {
        console.log(chalk.yellow('\n⚠️  Failed to install dependencies automatically.'));
        console.log(chalk.gray(`Please run: cd ${options.monorepoName} && pnpm install\n`));
    }
    console.log(chalk.green('\n✨ Monorepo created successfully!\n'));
    printNextSteps(options);
}
async function createFromTemplate(targetDir, template, options) {
    // Determine destination directory based on template type
    const destType = template.type === 'app' ? 'apps' : 'packages';
    const destDir = path.join(targetDir, destType, template.name);
    console.log(chalk.gray(`  Creating ${template.name} (${template.type})...`));
    // Copy template directory to destination
    await fs.ensureDir(destDir);
    await fs.copy(template.path, destDir, {
        filter: (src) => {
            // Don't copy template.json metadata file
            return !src.endsWith('template.json');
        }
    });
    // Replace @workspace/ references in all text files
    await replaceWorkspaceReferences(destDir, options.workspacePrefix);
}
async function replaceWorkspaceReferences(dir, workspacePrefix) {
    const textFileExtensions = ['.json', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md', '.css', '.scss', '.sass', '.less'];
    async function processDirectory(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                // Skip node_modules and other unnecessary directories
                if (entry.name === 'node_modules' || entry.name === '.git') {
                    continue;
                }
                await processDirectory(fullPath);
            }
            else if (entry.isFile()) {
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
                    }
                    catch (error) {
                        // Skip binary files or files that can't be read as text
                        console.log(chalk.yellow(`    Skipping ${entry.name} (not a text file)`));
                    }
                }
            }
        }
    }
    await processDirectory(dir);
}
async function scaffoldMonorepo(targetDir, options) {
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
    }
    else {
        console.log(chalk.yellow('\n⚠️  No templates selected, creating empty monorepo structure'));
    }
    // Add feature configurations
    await addFeatures(targetDir, options, finalTemplatesDir);
}
async function createRootStructure(targetDir, options, templatesDir) {
    // Create directories
    await fs.ensureDir(path.join(targetDir, 'apps'));
    await fs.ensureDir(path.join(targetDir, 'packages'));
    // Root package.json
    const hasAppTemplates = options.selectedTemplates.some(t => t.type === 'app');
    const appTemplates = options.selectedTemplates.filter(t => t.type === 'app');
    const hasDatabase = options.selectedTemplates.some(t => t.name === 'database');
    // Generate app-specific dev commands
    const appDevScripts = {};
    appTemplates.forEach(template => {
        appDevScripts[`dev:${template.name}`] = `pnpm --filter ${options.workspacePrefix}/${template.name} dev`;
    });
    // Generate dev:apps command if there are multiple apps
    const devAppsCommand = appTemplates.length > 0
        ? `pnpm --parallel ${appTemplates.map(t => `--filter ${options.workspacePrefix}/${t.name}`).join(' ')} run dev`
        : undefined;
    const rootPackageJson = {
        name: options.monorepoName,
        version: '1.0.0',
        private: true,
        scripts: {
            dev: devAppsCommand || 'pnpm run --parallel dev',
            ...(devAppsCommand && { 'dev:all': 'pnpm run --parallel dev' }),
            ...appDevScripts,
            build: 'pnpm run -r build',
            lint: 'pnpm run -r lint',
            test: 'pnpm run -r test',
            clean: 'pnpm run -r clean',
            ...(hasDatabase && {
                'db:generate': `pnpm --filter ${options.workspacePrefix}/database db:generate`,
                'db:migrate': `pnpm --filter ${options.workspacePrefix}/database db:migrate`,
                'migrate': `pnpm --filter ${options.workspacePrefix}/database migrate`
            }),
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
    await fs.writeFile(path.join(targetDir, 'pnpm-workspace.yaml'), `packages:\n  - 'apps/*'\n  - 'packages/*'\n`);
    await fs.writeJson(path.join(targetDir, 'package.json'), rootPackageJson, { spaces: 2 });
    // Copy .env.example from base template
    const envExamplePath = path.join(templatesDir, 'base', '.env.example');
    if (await fs.pathExists(envExamplePath)) {
        await fs.copy(envExamplePath, path.join(targetDir, '.env.example'));
    }
    // Generate root-level docker-compose.yml if any app templates are selected
    if (hasAppTemplates) {
        await generateDockerCompose(targetDir, options);
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
    // Generate dev commands documentation
    const devCommandsSection = appTemplates.length > 0
        ? `

## Development

\`\`\`bash
# Run all apps in parallel (recommended)
${options.packageManager} run dev

# Run all workspaces (apps + packages)
${options.packageManager} run dev:all
${appTemplates.map(t => `
# Run ${t.name} only
${options.packageManager} run dev:${t.name}`).join('')}
\`\`\``
        : `

## Development

\`\`\`bash
# Run development
${options.packageManager} run dev
\`\`\``;
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
${devCommandsSection}
${dockerSection}

## Structure

- \`apps/*\` - Applications
- \`packages/*\` - Shared packages
${templatesSection}
  `.trim();
    await fs.writeFile(path.join(targetDir, 'README.md'), readme);
}
async function generateDockerCompose(targetDir, options) {
    console.log(chalk.gray('  Adding root docker-compose.yml...'));
    const appTemplates = options.selectedTemplates.filter(t => t.type === 'app');
    const hasDatabase = options.selectedTemplates.some(t => t.name === 'database');
    let dockerCompose = `version: '3.8'\n\nservices:\n`;
    // Add app services
    for (const template of appTemplates) {
        const portMap = {
            web: '3000:3000',
            server: '3001:3001'
        };
        const envVars = {
            web: [
                'NODE_ENV: production',
                'API_URL: http://server:3001',
                ...(hasDatabase ? ['DATABASE_URL: postgresql://postgres:postgres@postgres:5432/myapp'] : [])
            ],
            server: [
                'NODE_ENV: production',
                'PORT: 3001',
                ...(hasDatabase ? ['DATABASE_URL: postgresql://postgres:postgres@postgres:5432/myapp'] : [])
            ]
        };
        const dependencies = template.name === 'web'
            ? ['server', ...(hasDatabase ? ['migrate'] : [])]
            : hasDatabase ? ['migrate'] : [];
        dockerCompose += `  # ${template.description}\n`;
        dockerCompose += `  ${template.name}:\n`;
        dockerCompose += `    build:\n`;
        dockerCompose += `      context: .\n`;
        dockerCompose += `      dockerfile: apps/${template.name}/Dockerfile\n`;
        dockerCompose += `    ports:\n`;
        dockerCompose += `      - '${portMap[template.name] || '3000:3000'}'\n`;
        dockerCompose += `    environment:\n`;
        (envVars[template.name] || ['NODE_ENV: production']).forEach(env => {
            dockerCompose += `      ${env}\n`;
        });
        if (dependencies.length > 0) {
            dockerCompose += `    depends_on:\n`;
            dependencies.forEach(dep => {
                dockerCompose += `      - ${dep}\n`;
            });
        }
        dockerCompose += `    restart: unless-stopped\n`;
        dockerCompose += `    networks:\n`;
        dockerCompose += `      - app-network\n\n`;
    }
    // Add PostgreSQL if database package is selected
    if (hasDatabase) {
        dockerCompose += `  # PostgreSQL database\n`;
        dockerCompose += `  postgres:\n`;
        dockerCompose += `    image: postgres:16-alpine\n`;
        dockerCompose += `    ports:\n`;
        dockerCompose += `      - '5432:5432'\n`;
        dockerCompose += `    environment:\n`;
        dockerCompose += `      POSTGRES_USER: postgres\n`;
        dockerCompose += `      POSTGRES_PASSWORD: postgres\n`;
        dockerCompose += `      POSTGRES_DB: myapp\n`;
        dockerCompose += `    volumes:\n`;
        dockerCompose += `      - postgres-data:/var/lib/postgresql/data\n`;
        dockerCompose += `    healthcheck:\n`;
        dockerCompose += `      test: ['CMD-SHELL', 'pg_isready -U postgres']\n`;
        dockerCompose += `      interval: 5s\n`;
        dockerCompose += `      timeout: 5s\n`;
        dockerCompose += `      retries: 5\n`;
        dockerCompose += `    restart: unless-stopped\n`;
        dockerCompose += `    networks:\n`;
        dockerCompose += `      - app-network\n\n`;
        // Add migration service
        dockerCompose += `  # Database migrations\n`;
        dockerCompose += `  migrate:\n`;
        dockerCompose += `    build:\n`;
        dockerCompose += `      context: .\n`;
        dockerCompose += `      dockerfile: packages/database/Dockerfile.migrate\n`;
        dockerCompose += `    environment:\n`;
        dockerCompose += `      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/myapp\n`;
        dockerCompose += `    depends_on:\n`;
        dockerCompose += `      postgres:\n`;
        dockerCompose += `        condition: service_healthy\n`;
        dockerCompose += `    networks:\n`;
        dockerCompose += `      - app-network\n`;
        dockerCompose += `    restart: 'no'\n\n`;
    }
    dockerCompose += `networks:\n`;
    dockerCompose += `  app-network:\n`;
    dockerCompose += `    driver: bridge\n`;
    if (hasDatabase) {
        dockerCompose += `\nvolumes:\n`;
        dockerCompose += `  postgres-data:\n`;
    }
    await fs.writeFile(path.join(targetDir, 'docker-compose.yml'), dockerCompose);
}
async function addFeatures(targetDir, options, templatesDir) {
    if (options.features.length === 0) {
        return;
    }
    console.log(chalk.blue('\n🔧 Adding features...'));
    // Read the root package.json to add dependencies
    const pkgJsonPath = path.join(targetDir, 'package.json');
    const rootPackageJson = await fs.readJson(pkgJsonPath);
    // Feature dependencies map (for root devDependencies)
    const featureDeps = {
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
    const featureScripts = {
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
async function installDependencies(targetDir) {
    console.log(chalk.blue('\n📦 Installing dependencies...'));
    return new Promise((resolve, reject) => {
        const install = spawn('pnpm', ['install'], {
            cwd: targetDir,
            stdio: 'inherit',
            shell: true
        });
        install.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`pnpm install exited with code ${code}`));
            }
            else {
                resolve();
            }
        });
        install.on('error', (err) => {
            reject(err);
        });
    });
}
function printNextSteps(options) {
    console.log(chalk.cyan('📝 Next steps:\n'));
    console.log(chalk.white(`  cd ${options.monorepoName}`));
    console.log(chalk.white(`  ${options.packageManager} run dev\n`));
    if (options.features.includes('changesets')) {
        console.log(chalk.gray('💡 To create a changeset:'));
        console.log(chalk.white(`  ${options.packageManager} changeset\n`));
    }
    console.log(chalk.gray('📚 Documentation:'));
    console.log(chalk.white('  pnpm workspaces: https://pnpm.io/workspaces'));
}
create().catch((error) => {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
});
