"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrHealUserAgencyId } from "@/lib/supabase/agency-helper";
import { DashboardKPISummary } from "@/types";

export async function getDashboardMetricsAction(): Promise<{ data?: DashboardKPISummary; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Authentication required." };
    }

    const agencyId = await getOrHealUserAgencyId(user.id);

    if (!agencyId) {
      return {
        data: {
          totalClients: 0,
          totalReports: 0,
          connectedPlatforms: 0,
          reportsThisMonth: 0,
        },
      };
    }

    // Query counts in parallel for active agency
    const [clientsRes, reportsRes, integrationsRes] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
      supabase.from("reports").select("id, created_at").eq("agency_id", agencyId),
      supabase.from("integrations").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
    ]);

    if (clientsRes.error) console.error("Error fetching clients count:", clientsRes.error);
    if (integrationsRes.error) console.error("Error fetching integrations count:", integrationsRes.error);

    const totalClients = clientsRes.count ?? 0;
    const connectedPlatforms = integrationsRes.count ?? 0;

    let totalReports = 0;
    let reportsThisMonth = 0;

    if (!reportsRes.error && reportsRes.data) {
      totalReports = reportsRes.data.length;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      reportsThisMonth = reportsRes.data.filter((r) => {
        const reportDate = new Date(r.created_at);
        return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
      }).length;
    }

    return {
      data: {
        totalClients,
        totalReports,
        connectedPlatforms,
        reportsThisMonth,
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch dashboard metrics." };
  }
}
