"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateReportDialog } from "@/components/reports/create-report-dialog";
import { getReportsAction, ReportWithClient, deleteReportAction } from "@/app/actions/reports";
import { getClientsAction } from "@/app/actions/clients";
import { Client } from "@/types";
import { FileText, Plus, Calendar, Loader2, Trash2, ArrowRight } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [repRes, cliRes] = await Promise.all([getReportsAction(), getClientsAction()]);
    if (repRes.data) setReports(repRes.data);
    if (cliRes.data) setClients(cliRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const [repRes, cliRes] = await Promise.all([getReportsAction(), getClientsAction()]);
      if (!ignore) {
        if (repRes.data) setReports(repRes.data);
        if (cliRes.data) setClients(cliRes.data);
        setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    setDeletingId(id);
    await deleteReportAction(id);
    setDeletingId(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generated client marketing reports and automated performance reviews.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Create Report
        </Button>
      </div>

      <CreateReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients}
        onReportCreated={fetchData}
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No reports generated yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Create your first performance audit report to aggregate multi-channel marketing metrics.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create First Report
          </Button>
        </Card>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">All Agency Reports</CardTitle>
            <CardDescription className="text-xs">
              Client-ready reports with unified multi-channel analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {report.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {report.client?.name || "Client Account"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {report.period_start} to {report.period_end}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={report.status === "published" ? "success" : "secondary"}
                      className="capitalize"
                    >
                      {report.status}
                    </Badge>
                    <Link href={`/dashboard/reports/${report.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      onClick={() => handleDelete(report.id)}
                      disabled={deletingId === report.id}
                    >
                      {deletingId === report.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
