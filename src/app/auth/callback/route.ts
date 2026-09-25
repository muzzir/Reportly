import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check agency membership and onboarding status
        const { data: member } = await supabase
          .from("agency_users")
          .select("agency_id, agencies(onboarding_completed)")
          .eq("user_id", user.id)
          .maybeSingle();

        const agency = Array.isArray(member?.agencies) ? member.agencies[0] : member?.agencies;

        if (!agency || !agency.onboarding_completed) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(new URL(next, request.url));
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(new URL(next, request.url));
        }
      }
    } else {
      console.error("Supabase PKCE code exchange failed:", error.message);
    }
  }

  // If exchange fails or code is missing, redirect to /login?error=VerificationFailed
  return NextResponse.redirect(new URL("/login?error=VerificationFailed", request.url));
}
