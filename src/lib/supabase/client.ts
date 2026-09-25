import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr";
import { Database } from "@/types/database";

/**
 * Sanitizes raw environment variable strings by stripping leading/trailing whitespace
 * and surrounding quotes (" or ').
 */
export function sanitizeEnvVal(val?: string): string {
  if (!val || typeof val !== "string") return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

export function getSupabaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sanitized = sanitizeEnvVal(envUrl).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  if (!sanitized || (!sanitized.startsWith("http://") && !sanitized.startsWith("https://"))) {
    return "https://placeholder-project.supabase.co";
  }
  return sanitized;
}

export function getSupabaseAnonKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return sanitizeEnvVal(envKey) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";
}

export function getSupabaseServiceRoleKey(): string {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return sanitizeEnvVal(envKey);
}

/**
 * Creates a browser-side Supabase client with database types.
 * Safe for use inside React Client Components.
 */
export function createClient() {
  return createBrowserSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}
