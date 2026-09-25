import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";
import { getSupabaseUrl, getSupabaseAnonKey } from "./client";

/**
 * Strict Next.js App Router Session Middleware.
 * Refreshes auth session cookies and strictly redirects unauthenticated requests on protected routes to /login.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  if (!supabaseUrl || supabaseUrl.includes("placeholder-project")) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protected routes: /dashboard and /admin
    const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

    if (isProtectedRoute && !user) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch (err) {
    console.warn("Middleware session update quiet error:", err);
  }

  return supabaseResponse;
}
