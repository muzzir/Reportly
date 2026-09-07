import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const placeholderReports = [
  {
    id: "rep-1",
    clientName: "Acme E-Commerce",
    title: "Q3 Meta Ads & GA4 Performance Overview",
    period: "Aug 1 - Aug 31, 2026",
    status: "published" as const,
  },
  {
    id: "rep-2",
    clientName: "Starlight SaaS",
    title: "Google Ads Lead Generation Report",
    period: "Aug 1 - Aug 31, 2026",
    status: "published" as const,
  },
  {
    id: "rep-3",
    clientName: "Zenith Retail",
    title: "Omnichannel Monthly Marketing Audit",
    period: "Aug 15 - Aug 31, 2026",
    status: "draft" as const,
  },
];

export function RecentActivity() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Recent Reports */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Recent Reports</CardTitle>
            <CardDescription className="text-xs">Latest performance reports for client accounts</CardDescription>
          </div>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {placeholderReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500">{report.clientName}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{report.title}</span>
                  <span className="text-[11px] text-slate-400">{report.period}</span>
                </div>
              </div>
              <Badge
                variant={report.status === "published" ? "success" : "secondary"}
                className="capitalize"
              >
                {report.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Architecture & Security Notice */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Phase 1 Infrastructure</CardTitle>
          <CardDescription className="text-xs">Architectural details and multi-tenant security status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="font-semibold text-slate-900 dark:text-slate-100">🔒 Multi-Tenant Row Level Security</span>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Supabase RLS is enforced at database layer. Queries verify agency membership via server-side authorization.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="font-semibold text-slate-900 dark:text-slate-100">⚙️ Server/Browser Client Isolation</span>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Isolated Supabase instances prevent service key exposure to client browser sessions.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="font-semibold text-slate-900 dark:text-slate-100">🛡️ Zod Input Validation</span>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Schemas established for Agency, Client, and Report payloads.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
