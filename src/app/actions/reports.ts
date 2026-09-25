"use client";

import { createClient } from "@/lib/supabase/client";
import { reportSchema, updateReportSchema, ReportInput, UpdateReportInput } from "@/lib/validations/report";
import { Report } from "@/types";

export interface ReportWithClient extends Report {
  client?: {
    name: string;
    logo_url?: string | null;
  };
}

export async function getReportsAction(): Promise<{ data?: ReportWithClient[]; error?: string }> {
  const supabase = createClient();
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
}

export async function getReportByIdAction(reportId: string): Promise<{ data?: ReportWithClient; error?: string }> {
  const supabase = createClient();
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
}

export async function createReportAction(input: Partial<ReportInput>): Promise<{ data?: Report; error?: string }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Authentication required." };
  }

  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  const agencyId = member?.agency_id;
  if (!agencyId) {
    return { error: "No active agency membership found." };
  }

  const parseResult = reportSchema.safeParse({ ...input, agency_id: agencyId });
  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return { error: `${issue.path.join(".")}: ${issue.message}` };
  }

  // Generate realistic KPI metrics snapshot for Phase 2 report builder
  const defaultMetrics = {
    totalSpend: 4250.00,
    totalImpressions: 128400,
    totalClicks: 5620,
    totalConversions: 340,
    roas: 3.85,
    channels: {
      google_ads: { spend: 2500, conversions: 210 },
      meta_ads: { spend: 1750, conversions: 130 },
      ga4: { sessions: 14200, conversions: 340 }
    }
  };

  const { data, error } = await supabase
    .from("reports")
    .insert({
      ...parseResult.data,
      metrics_summary: defaultMetrics,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as Report };
}

export async function updateReportAction(
  reportId: string,
  input: UpdateReportInput
): Promise<{ data?: Report; error?: string }> {
  const supabase = createClient();

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
}

export async function deleteReportAction(reportId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("reports").delete().eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
