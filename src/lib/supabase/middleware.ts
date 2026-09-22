import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

/**
 * Session refresh middleware.
 * Safely refreshes auth cookies if credentials exist, without enforcing strict redirects to /login.
 * Allows unauthenticated local dev access to /dashboard.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safety check: If Supabase URL or Anon Key is missing or invalid, bypass session update gracefully
  if (!rawUrl || !rawKey || !rawUrl.startsWith("http")) {
    return supabaseResponse;
  }

  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

  try {
    const supabase = createServerClient<Database>(
      supabaseUrl,
      rawKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh user session by calling getUser() silently
    await supabase.auth.getUser();
  } catch (err) {
    console.warn("Supabase session update in middleware encountered a quiet error:", err);
  }

  return supabaseResponse;
}
