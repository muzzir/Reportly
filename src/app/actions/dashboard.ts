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
  } else {
    // Fallback: If 'reports' table is not present in live DB, calculate reports from client automation activity
    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .not("last_report_sent_at", "is", null);
      
    totalReports = count ?? 0;
    reportsThisMonth = count ?? 0;
  }

  return {
    data: {
      totalClients,
      totalReports,
      connectedPlatforms,
      reportsThisMonth,
    },
  };
}
