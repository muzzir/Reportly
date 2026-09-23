import { Metadata } from "next";
import { getClientMetrics } from "@/lib/queries/metrics";
import { createClient } from "@/lib/supabase/server";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { KPICards } from "@/components/reports/KPICards";
import { MetricsChart } from "@/components/reports/MetricsChart";
import { CampaignTable } from "@/components/reports/CampaignTable";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, BarChart3 } from "lucide-react";

interface PublicReportPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export async function generateMetadata({
  params,
}: PublicReportPageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("name, is_public_sharing_enabled")
    .eq("public_token", token)
    .single();

  if (!client || !client.is_public_sharing_enabled) {
    return {
      title: "Report Access Disabled - Reportly",
      description: "This public report link is invalid or has been disabled.",
    };
  }

  return {
    title: `Performance Report - ${client.name}`,
    description: `Live multi-channel marketing performance overview for ${client.name}.`,
  };
}

export default async function PublicReportPage({
  params,
  searchParams,
}: PublicReportPageProps) {
  const { token } = await params;
  const { from, to } = await searchParams;

  const supabase = await createClient();

  // Fetch client by public_token
  const { data: client } = await supabase
    .from("clients")
    .select("*, agencies(*)")
    .eq("public_token", token)
    .single();

  // Check if link exists and public sharing is enabled
  if (!client || !client.is_public_sharing_enabled) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-slate-200 dark:border-slate-800 shadow-lg text-center p-8">
          <CardContent className="p-0 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <ShieldX className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Public Report Access Disabled
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This public report link is invalid, expired, or public access has been disabled by the agency.
              </p>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
              If you believe this is an error, please contact your account manager.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Resolve Agency branding
  const agency = Array.isArray(client.agencies)
    ? client.agencies[0]
    : client.agencies;

  const agencyBranding = {
    name: agency?.name || "Reportly Agency",
    logo_url: agency?.logo_url || null,
    primary_color: agency?.primary_color || "#2563eb",
    website: agency?.website || null,
  };

  // Fetch marketing metrics
  const metricsData = await getClientMetrics(client.id, from, to);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Control Bar with Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Live Client Portal
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {client.name} Performance Summary
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <DateRangePicker
              startDate={metricsData.startDate}
              endDate={metricsData.endDate}
            />
          </div>
        </div>

        {/* Content Section */}
        {!metricsData.hasData ? (
          <Card className="border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
            <CardContent className="p-0">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                No performance data for this period
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                No marketing metrics were found between <strong>{metricsData.startDate}</strong> and <strong>{metricsData.endDate}</strong>. Try selecting a different date range.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Section with Header, KPIs & Chart */}
            <div className="space-y-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
              <ReportHeader
                agency={agencyBranding}
                clientName={client.name}
                startDate={metricsData.startDate}
                endDate={metricsData.endDate}
              />

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Executive Summary KPIs
                </h3>
                <KPICards kpis={metricsData.kpis} />
              </div>

              <MetricsChart
                data={metricsData.timeSeries}
                primaryColor={agencyBranding.primary_color || undefined}
              />
            </div>

            {/* Campaign Breakdown Table */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
              <CampaignTable campaigns={metricsData.campaigns} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          Powered by <strong>Reportly</strong> • White-Labeled Live Performance Portal
        </div>
      </div>
    </div>
  );
}
