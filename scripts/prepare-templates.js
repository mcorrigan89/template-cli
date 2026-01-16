#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootTemplatesDir = path.join(__dirname, '..', '..', 'templates');
const cliTemplatesDir = path.join(__dirname, '..', 'templates');

async function prepareTemplates() {
  console.log('📦 Preparing templates for distribution...');

  // Remove existing cli/templates if it exists
  if (await fs.pathExists(cliTemplatesDir)) {
    await fs.remove(cliTemplatesDir);
  }

  // Copy templates from root to cli/templates
  await fs.copy(rootTemplatesDir, cliTemplatesDir);

  // Replace @template/ with @workspace/ in all text files
  const textFileExtensions = ['.json', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md'];

  async function processDirectory(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          await processDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (textFileExtensions.includes(ext)) {
          try {
            let content = await fs.readFile(fullPath, 'utf-8');
            const updated = content.replace(/@template\//g, '@workspace/');

            if (updated !== content) {
              await fs.writeFile(fullPath, updated, 'utf-8');
            }
          } catch (error) {
            // Skip binary files
          }
        }
      }
    }
  }

  await processDirectory(cliTemplatesDir);

  console.log('✅ Templates prepared successfully!');
}

prepareTemplates().catch((error) => {
  console.error('❌ Error preparing templates:', error);
  process.exit(1);
});
