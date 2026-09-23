/**
 * Verifies whether a user email is authorized as a Super Admin.
 * Checks against SUPER_ADMIN_EMAILS environment variable (comma-separated list).
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;

  const rawEnv = process.env.SUPER_ADMIN_EMAILS;
  let adminEmails: string[] = ["admin@reportly.com", "superadmin@reportly.com", "owner@reportly.com"];

  if (rawEnv && rawEnv.trim().length > 0) {
    adminEmails = rawEnv
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  return adminEmails.includes(email.trim().toLowerCase());
}
