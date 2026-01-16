import { z } from "zod";

/**
 * Server-only environment variables
 * These should NEVER be exposed to the client
 */
const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
});

export type ServerEnv = z.infer<typeof serverSchema>;

/**
 * Validates and returns server environment variables
 * Throws an error if validation fails
 */
export function getServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables");
  }

  return parsed.data;
}

// Singleton instance
let serverEnv: ServerEnv | null = null;

/**
 * Get validated server environment variables (cached)
 */
export function useServerEnv(): ServerEnv {
  if (!serverEnv) {
    serverEnv = getServerEnv();
  }
  return serverEnv;
}
