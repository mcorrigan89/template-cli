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
  external: [
    // Mark all node_modules as external (don't bundle them)
    /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/,
  ],
});
