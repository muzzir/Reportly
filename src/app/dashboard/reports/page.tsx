"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateReportDialog } from "@/components/reports/create-report-dialog";
import { getReportsAction, ReportWithClient, deleteReportAction } from "@/app/actions/reports";
import { getClientsAction } from "@/app/actions/clients";
import { Client } from "@/types";
import { FileText, Plus, Calendar, Loader2, Trash2, ArrowRight, ShieldAlert } from "lucide-react";
import { ToastBanner, ToastMessage } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ReportWithClient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteReportAction(reportToDelete.id);
      if (res.error) {
        setToast({
          id: Date.now().toString(),
          type: "error",
          title: "Delete Failed",
          description: res.error,
        });
      } else {
        setToast({
          id: Date.now().toString(),
          type: "success",
          title: "Report Deleted",
          description: `"${reportToDelete.title}" has been deleted.`,
        });
        setReportToDelete(null);
        fetchData();
      }
    } catch {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting the report.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastBanner message={toast} onClose={() => setToast(null)} />

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
        <EmptyState
          icon={FileText}
          title="No marketing reports generated yet"
          description="Create your first performance audit report to aggregate multi-channel marketing data for your clients."
          actionLabel="Create First Report"
          onAction={() => setDialogOpen(true)}
        />
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
                      onClick={() => setReportToDelete(report)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destructive Action Guard AlertDialog */}
      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Delete Marketing Report
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-slate-100">{reportToDelete?.title}</strong>?
              This will permanently remove the generated report and any associated PDF links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Report"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
