"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TimeSeriesMetricPoint } from "@/lib/queries/metrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CustomTooltipItem {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipItem[];
  label?: string;
}

interface MetricsChartProps {
  data: TimeSeriesMetricPoint[];
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-xl text-xs text-slate-100">
        <p className="font-semibold text-slate-300 mb-1">{label}</p>
        {payload.map((entry) => {
          const isSpend = entry.dataKey === "spend";
          const formattedVal = isSpend
            ? `$${Number(entry.value).toFixed(2)}`
            : Number(entry.value).toLocaleString();

          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.name}:
              </span>
              <span className="font-semibold text-white">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export function MetricsChart({ data }: MetricsChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Performance Trend Over Time
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Daily spend allocation vs conversion velocity across marketing channels
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                className="text-[11px] text-slate-500"
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />

              {/* Left Y-Axis for Spend ($) */}
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                className="text-[11px] text-slate-500"
                tickFormatter={(val) => `$${val}`}
              />

              {/* Right Y-Axis for Conversions */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                className="text-[11px] text-slate-500"
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                iconType="circle"
              />

              {/* Spend represented as Bar */}
              <Bar
                yAxisId="left"
                dataKey="spend"
                name="Spend ($)"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />

              {/* Conversions represented as Line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversions"
                name="Conversions"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981" }}
                activeDot={{ r: 6 }}
              />

              {/* Clicks represented as Line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="clicks"
                name="Clicks"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
