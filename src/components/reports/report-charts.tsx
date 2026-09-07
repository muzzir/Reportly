"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const performanceTimelineData = [
  { date: "Week 1", spend: 950, conversions: 75, roas: 3.6 },
  { date: "Week 2", spend: 1100, conversions: 92, roas: 3.9 },
  { date: "Week 3", spend: 1050, conversions: 88, roas: 3.8 },
  { date: "Week 4", spend: 1150, conversions: 105, roas: 4.1 },
];

const channelBreakdownData = [
  { channel: "Google Ads", spend: 2500, conversions: 210 },
  { channel: "Meta Ads", spend: 1750, conversions: 130 },
  { channel: "GA4 Traffic", spend: 0, conversions: 340, sessions: 14200 },
];

export function ReportCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
      {/* Spend vs Conversions Area Chart */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Weekly Spend & Conversions</CardTitle>
          <CardDescription className="text-xs">
            Performance trend over the reporting period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-[11px]" />
                <YAxis tickLine={false} axisLine={false} className="text-[11px]" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Spend ($)"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  name="Conversions"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#convGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Channel Comparison Bar Chart */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Channel Acquisition Breakdown</CardTitle>
          <CardDescription className="text-xs">
            Comparison of spend and conversion totals per channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="channel" tickLine={false} axisLine={false} className="text-[11px]" />
                <YAxis tickLine={false} axisLine={false} className="text-[11px]" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="spend" name="Spend ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" name="Conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
