"use client";

import { useEffect, useState, useCallback } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { CreateReportDialog } from "@/components/reports/create-report-dialog";
import { getDashboardMetricsAction } from "@/app/actions/dashboard";
import { getClientsAction } from "@/app/actions/clients";
import { getAgencyAction, AgencyWithUser } from "@/app/actions/agency";
import { DashboardKPISummary, Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<DashboardKPISummary | undefined>(undefined);
  const [clients, setClients] = useState<Client[]>([]);
  const [agency, setAgency] = useState<AgencyWithUser | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const fetchOverviewData = useCallback(async () => {
    const [metRes, cliRes, agRes] = await Promise.all([
      getDashboardMetricsAction(),
      getClientsAction(),
      getAgencyAction(),
    ]);

    if (metRes.data) setMetrics(metRes.data);
    if (cliRes.data) setClients(cliRes.data);
    if (agRes.data) setAgency(agRes.data);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const [metRes, cliRes, agRes] = await Promise.all([
        getDashboardMetricsAction(),
        getClientsAction(),
        getAgencyAction(),
      ]);
      if (!ignore) {
        if (metRes.data) setMetrics(metRes.data);
        if (cliRes.data) setClients(cliRes.data);
        if (agRes.data) setAgency(agRes.data);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const agencyName = agency?.name || "your workspace";
  const userDisplayName = agency?.userEmail ? agency.userEmail.split("@")[0] : "Team";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">
            Good day, {userDisplayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is your performance overview for <span className="font-semibold text-foreground">{agencyName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border"
            onClick={() => setClientDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
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
