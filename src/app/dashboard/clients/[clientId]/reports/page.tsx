import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientMetrics } from "@/lib/queries/metrics";
import { createClient } from "@/lib/supabase/server";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { KPICards } from "@/components/reports/KPICards";
import { MetricsChart } from "@/components/reports/MetricsChart";
import { CampaignTable } from "@/components/reports/CampaignTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Plug } from "lucide-react";

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

  // Query aggregated metrics from database
  const metricsData = await getClientMetrics(clientId, from, to);

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumbs */}
      <div>
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Performance Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Unified multi-channel reporting for <strong className="text-slate-700 dark:text-slate-300">{client.name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DateRangePicker
              startDate={metricsData.startDate}
              endDate={metricsData.endDate}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!metricsData.hasData ? (
        <Card className="border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            No marketing metrics available
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            No metrics were found for {client.name} between{" "}
            <strong>{metricsData.startDate}</strong> and <strong>{metricsData.endDate}</strong>.
            Connect marketing ad platforms and trigger a sync, or change your date filter range.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href={`/dashboard/clients/${clientId}/integrations`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plug className="h-4 w-4" />
                Manage Integrations & Sync
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Aggregate KPI Summary Cards */}
          <KPICards kpis={metricsData.kpis} />

          {/* Recharts Time-Series Chart */}
          <MetricsChart data={metricsData.timeSeries} />

          {/* Campaign Breakdown Table */}
          <CampaignTable campaigns={metricsData.campaigns} />
        </div>
      )}
    </div>
  );
}
