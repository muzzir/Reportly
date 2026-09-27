"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrHealUserAgencyId } from "@/lib/supabase/agency-helper";
import { reportSchema, updateReportSchema, ReportInput, UpdateReportInput } from "@/lib/validations/report";
import { Report } from "@/types";

export interface ReportWithClient extends Report {
  client?: {
    name: string;
    logo_url?: string | null;
  };
}

export async function getReportsAction(): Promise<{ data?: ReportWithClient[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*, clients(name, logo_url)")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
        return { data: [] };
      }
      return { error: error.message };
    }

    const reports = (data || []).map((r) => ({
      ...r,
      client: r.clients ? { name: r.clients.name, logo_url: r.clients.logo_url } : undefined,
    }));

    return { data: reports as ReportWithClient[] };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch reports." };
  }
}

export async function getReportByIdAction(reportId: string): Promise<{ data?: ReportWithClient; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*, clients(name, logo_url, website, industry)")
      .eq("id", reportId)
      .single();

    if (error) {
      return { error: error.message };
    }

    const report = {
      ...data,
      client: data.clients ? { name: data.clients.name, logo_url: data.clients.logo_url } : undefined,
    };

    return { data: report as ReportWithClient };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch report." };
  }
}

export async function createReportAction(input: Partial<ReportInput>): Promise<{ data?: Report; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Authentication required." };
    }

    const agencyId = await getOrHealUserAgencyId(user.id);

    if (!agencyId) {
      return { error: "No active agency membership found." };
    }

    if (!input.client_id) {
      return { error: "Target client is required to create a report." };
    }

    const parseResult = reportSchema.safeParse({
      ...input,
      agency_id: agencyId,
      status: input.status || "draft",
    });

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return { error: `${issue.path.join(".")}: ${issue.message}` };
    }

    // Query actual performance metrics from marketing_metrics table for this client
    const { data: metricsData } = await supabase
      .from("marketing_metrics")
      .select("*")
      .eq("client_id", parseResult.data.client_id)
      .gte("date", parseResult.data.period_start)
      .lte("date", parseResult.data.period_end);

    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    const channels: Record<string, { spend: number; conversions: number; sessions?: number }> = {};

    if (metricsData && metricsData.length > 0) {
      for (const row of metricsData) {
        totalSpend += Number(row.spend) || 0;
        totalImpressions += Number(row.impressions) || 0;
        totalClicks += Number(row.clicks) || 0;
        totalConversions += Number(row.conversions) || 0;

        const provider = (row as { provider?: string }).provider || "other";
        if (!channels[provider]) {
          channels[provider] = { spend: 0, conversions: 0 };
        }
        channels[provider].spend += Number(row.spend) || 0;
        channels[provider].conversions += Number(row.conversions) || 0;
      }
    }

    const roas = totalSpend > 0 ? Number((totalConversions * 50 / totalSpend).toFixed(2)) : 0;

    const metricsSummary = {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      roas,
      channels,
    };

    const { data, error } = await supabase
      .from("reports")
      .insert({
        agency_id: agencyId,
        client_id: parseResult.data.client_id,
        title: parseResult.data.title || "Client Performance Report",
        period_start: parseResult.data.period_start,
        period_end: parseResult.data.period_end,
        status: parseResult.data.status || "draft",
        metrics_summary: metricsSummary,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Report };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create report." };
  }
}

export async function updateReportAction(
  reportId: string,
  input: UpdateReportInput
): Promise<{ data?: Report; error?: string }> {
  try {
    const supabase = await createClient();

    const parseResult = updateReportSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return { error: `${issue.path.join(".")}: ${issue.message}` };
    }

    const { data, error } = await supabase
      .from("reports")
      .update(parseResult.data)
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Report };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update report." };
  }
}

export async function deleteReportAction(reportId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("reports").delete().eq("id", reportId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete report." };
  }
}
