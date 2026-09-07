"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getReportByIdAction, ReportWithClient } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportCharts } from "@/components/reports/report-charts";
import { ArrowLeft, Printer, Download, Calendar, DollarSign, TrendingUp, Target, Loader2 } from "lucide-react";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [report, setReport] = useState<ReportWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      const res = await getReportByIdAction(resolvedParams.id);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setReport(res.data);
      }
    }
    loadReport();
  }, [resolvedParams.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4 text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Report Not Found</h2>
        <p className="text-xs text-slate-500">{error || "The requested report does not exist."}</p>
        <Link href="/dashboard/reports">
          <Button variant="outline" size="sm">
            Back to Reports
          </Button>
        </Link>
      </div>
    );
  }

  // Extract snapshot metrics
  const metrics = (report as unknown as { metrics_summary: { totalSpend: number; totalImpressions: number; totalClicks: number; totalConversions: number; roas: number } }).metrics_summary || {
    totalSpend: 4250,
    totalImpressions: 128400,
    totalClicks: 5620,
    totalConversions: 340,
    roas: 3.85,
  };

  return (
    <div className="space-y-8 print:p-0 print:space-y-6">
      {/* Action Bar (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-950 print:border-none print:shadow-none print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {report.client?.name || "Client Performance Audit"}
              </span>
              <Badge variant={report.status === "published" ? "success" : "secondary"}>
                {report.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1">
              {report.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Reporting Period: {report.period_start} to {report.period_end}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">Reportly</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Client Ready</p>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-4 print:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-slate-500">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalSpend.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Budget efficiently allocated</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-slate-500">Conversions</CardTitle>
            <Target className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalConversions.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">+18.4% vs last period</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-slate-500">Return on Ad Spend (ROAS)</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.roas}x</div>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">$3.85 return per $1 spent</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase text-slate-500">Impressions</CardTitle>
            <Calendar className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalImpressions.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">CTR: {((metrics.totalClicks / metrics.totalImpressions) * 100).toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <ReportCharts />

      {/* Channel Breakdown Summary Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Channel Performance Breakdown</CardTitle>
          <CardDescription className="text-xs">Granular acquisition and spend breakdown per marketing network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <tr>
                  <th className="p-3 font-semibold">Channel</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Ad Spend</th>
                  <th className="p-3 font-semibold">Conversions</th>
                  <th className="p-3 font-semibold">Cost Per Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-medium text-slate-900 dark:text-slate-100">Google Ads</td>
                  <td className="p-3"><Badge variant="success">Active</Badge></td>
                  <td className="p-3 font-semibold">$2,500.00</td>
                  <td className="p-3 font-semibold">210</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">$11.90</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-900 dark:text-slate-100">Meta Ads (FB/IG)</td>
                  <td className="p-3"><Badge variant="success">Active</Badge></td>
                  <td className="p-3 font-semibold">$1,750.00</td>
                  <td className="p-3 font-semibold">130</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">$13.46</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-900 dark:text-slate-100">Google Analytics 4</td>
                  <td className="p-3"><Badge variant="secondary">Connected</Badge></td>
                  <td className="p-3 text-slate-400">—</td>
                  <td className="p-3 font-semibold">340 Total Sessions</td>
                  <td className="p-3 text-slate-400">Attributed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
