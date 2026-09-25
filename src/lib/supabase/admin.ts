import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "./client";

export function createAdminClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
