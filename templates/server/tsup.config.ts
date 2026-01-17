import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  tsconfig: './tsconfig.json', // Use tsconfig for path resolution
  external: [
    // Mark all node_modules as external (don't bundle them)
    /^[^./]|^\.[^./]|^\.\.[^/]/,
  ],
});
