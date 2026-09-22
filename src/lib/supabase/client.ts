import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr";
import { Database } from "@/types/database";

export function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

/**
 * Creates a browser-side Supabase client with database types.
 * Safe for use inside React Client Components.
 */
export function createClient() {
  return createBrowserSupabaseClient<Database>(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
