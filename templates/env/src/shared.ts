import { z } from 'zod';

/**
 * Shared environment variables
 * These can be safely used in both client and server contexts
 * Make sure these don't contain sensitive information
 */
const sharedSchema = z.object({
  // Application configuration
  SERVER_URL: z.string().url().default('http://localhost:3001'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  // Environment type
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Feature flags (non-sensitive)
  ENABLE_MAINTENANCE_MODE: z.coerce.boolean().default(false),
});

export type SharedEnv = z.infer<typeof sharedSchema>;

/**
 * Validates and returns shared environment variables
 * Works in both Node.js (process.env) and browser (import.meta.env) contexts
 * Throws an error if validation fails
 */
export function getSharedEnv(): SharedEnv {
  // Try process.env first (Node.js), fallback to import.meta.env (browser)
  const env =
    typeof process !== 'undefined'
      ? process.env
      : (import.meta as { env?: Record<string, string | undefined> }).env || {};

  const parsed = sharedSchema.safeParse(env);

  if (!parsed.success) {
    console.error('❌ Invalid shared environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid shared environment variables');
  }

  return parsed.data;
}

// Singleton instance
let sharedEnv: SharedEnv | null = null;

/**
 * Get validated shared environment variables (cached)
 */
export function useSharedEnv(): SharedEnv {
  if (!sharedEnv) {
    sharedEnv = getSharedEnv();
  }
  return sharedEnv;
}
