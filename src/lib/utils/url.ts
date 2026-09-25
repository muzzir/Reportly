/**
 * Returns the canonical base URL for the application.
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL environment variable (if explicitly set)
 * 2. VERCEL_URL environment variable (automatically provided on Vercel)
 * 3. Fallback to local development host
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
