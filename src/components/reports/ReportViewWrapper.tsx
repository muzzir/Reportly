"use client";

import { useState, useRef } from "react";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { KPICards } from "@/components/reports/KPICards";
import { MetricsChart } from "@/components/reports/MetricsChart";
import { CampaignTable } from "@/components/reports/CampaignTable";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { DownloadPDFButton } from "@/components/reports/DownloadPDFButton";
import { SendReportDialog } from "@/components/reports/SendReportDialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { AggregateKPIs, CampaignMetricRow, TimeSeriesMetricPoint } from "@/lib/queries/metrics";

interface AgencyBranding {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  website?: string | null;
}

interface ReportViewWrapperProps {
  clientId: string;
  agency: AgencyBranding;
  clientName: string;
  startDate: string;
  endDate: string;
  kpis: AggregateKPIs;
  timeSeries: TimeSeriesMetricPoint[];
  campaigns: CampaignMetricRow[];
}

export function ReportViewWrapper({
  clientId,
  agency,
  clientName,
  startDate,
  endDate,
  kpis,
  timeSeries,
  campaigns,
}: ReportViewWrapperProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Interactive Controls Bar (Hidden from final PDF output) */}
      <div className="pdf-hide flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Performance Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Unified multi-channel reporting for{" "}
            <strong className="text-slate-700 dark:text-slate-300">{clientName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker startDate={startDate} endDate={endDate} />
          <DownloadPDFButton
            reportRef={reportRef}
            clientName={clientName}
            startDate={startDate}
            endDate={endDate}
          />
          <Button
            onClick={() => setIsEmailDialogOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs font-medium text-xs"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Send Email</span>
          </Button>
        </div>
      </div>

      {/* Printable Report View Target */}
      <div ref={reportRef} className="space-y-6 bg-slate-50/50 dark:bg-slate-950/50 p-2 sm:p-4 rounded-xl">
        {/* Section 1: Branded Header, KPI Summary Cards, & Performance Trend Chart */}
        <div data-pdf-section="section-overview" className="space-y-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
          <ReportHeader
            agency={agency}
            clientName={clientName}
            startDate={startDate}
            endDate={endDate}
          />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
              Executive Summary KPIs
            </h3>
            <KPICards kpis={kpis} />
          </div>

          <MetricsChart
            data={timeSeries}
            primaryColor={agency.primary_color || undefined}
          />
        </div>

        {/* Section 2: Campaign Breakdown Table */}
        <div data-pdf-section="section-table" className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
          <CampaignTable campaigns={campaigns} />
        </div>
      </div>

      {/* Send Email Dialog Modal */}
      <SendReportDialog
        isOpen={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        reportRef={reportRef}
        clientId={clientId}
        clientName={clientName}
        startDate={startDate}
        endDate={endDate}
        agencyName={agency.name}
      />
    </div>
  );
}
