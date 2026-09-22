import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr";
import { Database } from "@/types/database";

export function getSupabaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!envUrl || typeof envUrl !== "string") {
    return "https://placeholder-project.supabase.co";
  }
  const trimmed = envUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  if (!trimmed || (!trimmed.startsWith("http://") && !trimmed.startsWith("https://"))) {
    return "https://placeholder-project.supabase.co";
  }
  return trimmed;
}

export function getSupabaseAnonKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!envKey || typeof envKey !== "string" || !envKey.trim()) {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";
  }
  return envKey.trim();
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
