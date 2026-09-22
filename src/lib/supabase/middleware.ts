import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

/**
 * Updates user session token in cookies if expired.
 * Enforces route protection for unauthenticated requests to /dashboard.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Refresh user session by calling getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  const isAuthRoute = url.pathname.startsWith("/login") || url.pathname.startsWith("/signup");

  // If user is NOT authenticated and attempts to access /dashboard (or any sub-route), redirect to /login
  if (!user && isDashboardRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user IS authenticated and visits /login or /signup, redirect to /dashboard
  if (user && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
