import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { OAUTH_PROVIDERS, encodeOAuthState } from "@/lib/oauth/config";
import { IntegrationProvider } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const provider = providerParam as IntegrationProvider;

  const providerConfig = OAUTH_PROVIDERS[provider];
  if (!providerConfig) {
    return NextResponse.json({ error: "Invalid integration provider" }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId query parameter is required" }, { status: 400 });
  }

  // Verify authentication & agency access
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Verify client belongs to user's agency
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, agency_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    return NextResponse.json(
      { error: "Client not found or access denied." },
      { status: 403 }
    );
  }

  // Generate cryptographically secure CSRF token & state payload
  const csrfToken = crypto.randomBytes(16).toString("hex");
  const statePayload = {
    csrfToken,
    clientId,
    provider,
    timestamp: Date.now(),
  };

  const encodedState = encodeOAuthState(statePayload);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const callbackUrl = `${baseUrl}/api/integrations/${provider}/callback`;

  // Set CSRF token in HTTP-only cookie
  const response = process.env.MOCK_OAUTH === "true"
    ? NextResponse.redirect(`${callbackUrl}?code=mock_code_${Date.now()}&state=${encodeURIComponent(encodedState)}`)
    : (() => {
        const clientIdEnv = process.env[providerConfig.clientIdEnv] || "mock_client_id";
        const authUrl = new URL(providerConfig.authUrl);
        authUrl.searchParams.set("client_id", clientIdEnv);
        authUrl.searchParams.set("redirect_uri", callbackUrl);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", providerConfig.scopes.join(" "));
        authUrl.searchParams.set("state", encodedState);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        return NextResponse.redirect(authUrl.toString());
      })();

  response.cookies.set("oauth_csrf_token", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 1 hour
    path: "/",
  });

  return response;
}
