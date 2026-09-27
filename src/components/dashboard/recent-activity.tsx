import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { ReportWithClient } from "@/app/actions/reports";

interface RecentActivityProps {
  reports?: ReportWithClient[];
  onNewReportClick?: () => void;
}

export function RecentActivity({ reports = [], onNewReportClick }: RecentActivityProps) {
  const recentReports = reports.slice(0, 5);

  return (
    <div className="w-full">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Recent Reports</CardTitle>
            <CardDescription className="text-xs">Latest performance reports for client accounts</CardDescription>
          </div>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg bg-muted/20 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">No reports generated yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Create your first automated marketing performance report for a client to display it here.
              </p>
              {onNewReportClick && (
                <button
                  onClick={onNewReportClick}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Report
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const clientName = report.client?.name || "Client Account";
                const period = report.period_start && report.period_end
                  ? `${new Date(report.period_start).toLocaleDateString()} - ${new Date(report.period_end).toLocaleDateString()}`
                  : report.created_at
                  ? new Date(report.created_at).toLocaleDateString()
                  : "Recent";

                return (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">{clientName}</span>
                        <span className="text-sm font-semibold text-foreground">{report.title}</span>
                        <span className="text-[11px] text-muted-foreground/80">{period}</span>
                      </div>
                    </div>
                    <Badge
                      variant={report.status === "published" ? "success" : "secondary"}
                      className="capitalize"
                    >
                      {report.status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
