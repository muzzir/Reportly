import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientMetrics } from "@/lib/queries/metrics";
import { createClient } from "@/lib/supabase/server";
import { ReportViewWrapper } from "@/components/reports/ReportViewWrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { DateRangePicker } from "@/components/reports/DateRangePicker";

interface ClientReportsPageProps {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ClientReportsPage({
  params,
  searchParams,
}: ClientReportsPageProps) {
  const { clientId } = await params;
  const { from, to } = await searchParams;

  const supabase = await createClient();

  // Fetch client details
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) {
    notFound();
  }

  // Fetch agency details for white-label branding
  const { data: agency } = await supabase
    .from("agencies")
    .select("name, logo_url, primary_color, website")
    .eq("id", client.agency_id)
    .single();

  const agencyBranding = {
    name: agency?.name || "Reportly Agency",
    logo_url: agency?.logo_url || null,
    primary_color: agency?.primary_color || "#2563eb",
    website: agency?.website || null,
  };

  // Query aggregated metrics from database
  const metricsData = await getClientMetrics(clientId, from, to);

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumbs (Hidden from PDF output) */}
      <div className="pdf-hide">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link
            href="/dashboard/clients"
            className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Clients
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {client.name}
          </span>
          <span>/</span>
          <span>Reports & Analytics</span>
        </div>
      </div>

      {/* Main Content Area */}
      {!metricsData.hasData ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pdf-hide">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Performance Overview
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Unified multi-channel reporting for{" "}
                <strong className="text-slate-700 dark:text-slate-300">{client.name}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <DateRangePicker
                startDate={metricsData.startDate}
                endDate={metricsData.endDate}
              />
            </div>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No marketing metrics found for this date range"
            description={`No metrics were found for ${client.name} between ${metricsData.startDate} and ${metricsData.endDate}. Connect data sources or adjust your date filter range.`}
          />
        </div>
      ) : (
        <ReportViewWrapper
          clientId={clientId}
          agency={agencyBranding}
          clientName={client.name}
          startDate={metricsData.startDate}
          endDate={metricsData.endDate}
          kpis={metricsData.kpis}
          timeSeries={metricsData.timeSeries}
          campaigns={metricsData.campaigns}
          publicToken={client.public_token}
          isPublicSharingEnabled={client.is_public_sharing_enabled}
        />
      )}
    </div>
  );
}
