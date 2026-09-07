import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr";

/**
 * Creates a browser-side Supabase client singleton.
 * Safe for use inside React Client Components.
 */
export function createClient() {
  return createBrowserSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
