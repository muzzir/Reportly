"use client";

import { createClient } from "@/lib/supabase/client";
import { DashboardKPISummary } from "@/types";

export async function getDashboardMetricsAction(): Promise<{ data?: DashboardKPISummary; error?: string }> {
  const supabase = createClient();

  // Query counts in parallel
  const [clientsRes, reportsRes, integrationsRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id, created_at"),
    supabase.from("integrations").select("id", { count: "exact", head: true }),
  ]);

  if (clientsRes.error) console.error("Error fetching clients count:", clientsRes.error);
  if (reportsRes.error) console.error("Error fetching reports:", reportsRes.error);
  if (integrationsRes.error) console.error("Error fetching integrations count:", integrationsRes.error);

  const totalClients = clientsRes.count ?? 0;
  const totalReports = reportsRes.data?.length ?? 0;
  const connectedPlatforms = integrationsRes.count ?? 0;

  // Filter reports generated this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const reportsThisMonth = (reportsRes.data || []).filter((r) => {
    const reportDate = new Date(r.created_at);
    return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
  }).length;

  return {
    data: {
      totalClients,
      totalReports,
      connectedPlatforms,
      reportsThisMonth,
    },
  };
}
