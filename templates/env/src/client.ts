import { z } from "zod";

/**
 * Client-safe environment variables
 * These are safe to expose to the browser/client
 * Typically prefixed with VITE_, NEXT_PUBLIC_, or similar
 */
const clientSchema = z.object({
  VITE_APP_NAME: z.string().default("App"),
});

export type ClientEnv = z.infer<typeof clientSchema>;

/**
 * Validates and returns client environment variables
 * Throws an error if validation fails
 */
export function getClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse(import.meta.env);

  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables");
  }

  return parsed.data;
}

// Singleton instance
let clientEnv: ClientEnv | null = null;

/**
 * Get validated client environment variables (cached)
 */
export function useClientEnv(): ClientEnv {
  if (!clientEnv) {
    clientEnv = getClientEnv();
  }
  return clientEnv;
}
