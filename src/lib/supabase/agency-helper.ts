import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolves the active agency ID for a user with auto-healing fallback.
 * If the user's agency_users/agency_members record is missing, it auto-heals by linking
 * the user to the existing agency in the database as owner.
 */
export async function getOrHealUserAgencyId(userId: string): Promise<string | null> {
  const supabase = await createClient();

  // 1. Try agency_users table
  const { data: userMember } = await supabase
    .from("agency_users")
    .select("agency_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (userMember?.agency_id) {
    return userMember.agency_id;
  }

  // 2. Try agency_members table
  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (member?.agency_id) {
    // Sync to agency_users via admin client for consistency
    const adminClient = createAdminClient();
    await adminClient.from("agency_users").upsert({
      agency_id: member.agency_id,
      user_id: userId,
      role: "owner",
    }, { onConflict: "agency_id,user_id" });
    return member.agency_id;
  }

  // 3. Auto-healing fallback: query agencies table via admin client
  const adminClient = createAdminClient();
  const { data: existingAgency } = await adminClient
    .from("agencies")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingAgency?.id) {
    // Auto-heal by inserting missing agency_users and agency_members records
    await Promise.all([
      adminClient.from("agency_users").upsert({
        agency_id: existingAgency.id,
        user_id: userId,
        role: "owner",
      }, { onConflict: "agency_id,user_id" }),
      adminClient.from("agency_members").upsert({
        agency_id: existingAgency.id,
        user_id: userId,
        role: "owner",
      }, { onConflict: "agency_id,user_id" }),
    ]);

    return existingAgency.id;
  }

  return null;
}
