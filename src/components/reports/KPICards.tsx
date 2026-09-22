import { AggregateKPIs } from "@/lib/queries/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Eye, MousePointerClick, Target, TrendingUp, Percent } from "lucide-react";

interface KPICardsProps {
  kpis: AggregateKPIs;
}

export function KPICards({ kpis }: KPICardsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat("en-US").format(val);

  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  const items = [
    {
      title: "Total Spend",
      value: formatCurrency(kpis.totalSpend),
      subtitle: "Aggregate ad spend",
      icon: DollarSign,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      title: "Impressions",
      value: formatNumber(kpis.totalImpressions),
      subtitle: "Total ad views",
      icon: Eye,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400",
    },
    {
      title: "Clicks",
      value: formatNumber(kpis.totalClicks),
      subtitle: "Total user clicks",
      icon: MousePointerClick,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      title: "Conversions",
      value: formatNumber(kpis.totalConversions),
      subtitle: "Completed goals",
      icon: Target,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
    },
    {
      title: "CPA",
      value: formatCurrency(kpis.cpa),
      subtitle: "Cost per acquisition",
      icon: TrendingUp,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400",
    },
    {
      title: "CTR",
      value: formatPercent(kpis.ctr),
      subtitle: "Click-through rate",
      icon: Percent,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="border-slate-200 dark:border-slate-800 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {item.title}
                </span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${item.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {item.value}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                {item.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
