"use client";

import { useEffect, useState, useCallback } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { CreateReportDialog } from "@/components/reports/create-report-dialog";
import { getDashboardMetricsAction } from "@/app/actions/dashboard";
import { getClientsAction } from "@/app/actions/clients";
import { DashboardKPISummary, Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<DashboardKPISummary | undefined>(undefined);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const fetchOverviewData = useCallback(async () => {
    const [metRes, cliRes] = await Promise.all([
      getDashboardMetricsAction(),
      getClientsAction(),
    ]);

    if (metRes.data) setMetrics(metRes.data);
    if (cliRes.data) setClients(cliRes.data);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const [metRes, cliRes] = await Promise.all([
        getDashboardMetricsAction(),
        getClientsAction(),
      ]);
      if (!ignore) {
        if (metRes.data) setMetrics(metRes.data);
        if (cliRes.data) setClients(cliRes.data);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Good morning, Alex
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Here is your agency&apos;s performance overview for Apex Marketing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setClientDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setReportDialogOpen(true)}
          >
            <FileText className="h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      <AddClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onClientAdded={fetchOverviewData}
      />

      <CreateReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        clients={clients}
        onReportCreated={fetchOverviewData}
      />

      {/* KPI Cards */}
      <KPICards data={metrics} />

      {/* Main Content Sections */}
      <RecentActivity />
    </div>
  );
}
