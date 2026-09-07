import { Users, FileText, Plug, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardKPISummary } from "@/types";

interface KPICardsProps {
  data?: DashboardKPISummary;
}

export function KPICards({ data }: KPICardsProps) {
  // Placeholder KPI values (structured so real data can replace them easily)
  const metrics = [
    {
      title: "Active Clients",
      value: data?.totalClients ?? 12,
      change: "+2 this month",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Total Reports",
      value: data?.totalReports ?? 48,
      change: "+14 this month",
      icon: FileText,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      title: "Connected Platforms",
      value: data?.connectedPlatforms ?? 3,
      change: "Google Ads, Meta, GA4",
      icon: Plug,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Reports This Month",
      value: data?.reportsThisMonth ?? 18,
      change: "94% client-ready",
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {metric.value}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {metric.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
