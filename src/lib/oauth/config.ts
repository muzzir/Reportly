import crypto from "crypto";
import { IntegrationProvider } from "@/types";

export interface OAuthProviderConfig {
  id: IntegrationProvider;
  name: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  category: string;
  description: string;
}

export const OAUTH_PROVIDERS: Record<IntegrationProvider, OAuthProviderConfig> = {
  google_ads: {
    id: "google_ads",
    name: "Google Ads",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/adwords"],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    category: "Paid Search & Display",
    description: "Import campaign performance, impressions, clicks, cost-per-lead, and conversion metrics.",
  },
  meta_ads: {
    id: "meta_ads",
    name: "Meta Ads (Facebook & Instagram)",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["ads_read", "business_management", "read_insights"],
    clientIdEnv: "META_CLIENT_ID",
    clientSecretEnv: "META_CLIENT_SECRET",
    category: "Paid Social",
    description: "Sync social ad spend, ROAS, click-through rates, demographic insights, and creative analytics.",
  },
  ga4: {
    id: "ga4",
    name: "Google Analytics 4",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    category: "Web Analytics",
    description: "Track user traffic, engagement rate, event conversions, channel attribution, and session duration.",
  },
};

export interface OAuthStatePayload {
  csrfToken: string;
  clientId: string;
  provider: IntegrationProvider;
  timestamp: number;
}

const STATE_SECRET = process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET || "oauth_state_signing_secret_dev";

/**
 * Encodes state payload with an HMAC signature to prevent CSRF attacks & tampering.
 */
export function encodeOAuthState(payload: OAuthStatePayload): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString("base64url");
  const signature = crypto.createHmac("sha256", STATE_SECRET).update(base64).digest("base64url");
  return `${base64}.${signature}`;
}

/**
 * Decodes and verifies state payload signature. Returns null if invalid or expired.
 */
export function decodeOAuthState(stateParam: string): OAuthStatePayload | null {
  if (!stateParam || !stateParam.includes(".")) return null;
  try {
    const [base64, signature] = stateParam.split(".");
    const expectedSignature = crypto.createHmac("sha256", STATE_SECRET).update(base64).digest("base64url");

    if (signature !== expectedSignature) {
      console.error("OAuth state signature mismatch — potential CSRF attack detected.");
      return null;
    }

    const json = Buffer.from(base64, "base64url").toString("utf8");
    const payload = JSON.parse(json) as OAuthStatePayload;

    // Check expiration (state valid for 1 hour)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > ONE_HOUR) {
      console.error("OAuth state token expired.");
      return null;
    }

    return payload;
  } catch (err) {
    console.error("Failed to decode OAuth state param:", err);
    return null;
  }
}
