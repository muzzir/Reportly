"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, Check } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
}

export function DateRangePicker({ startDate, endDate }: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(startDate);
  const [to, setTo] = useState(endDate);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const applyRange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", newFrom);
    params.set("to", newTo);
    router.push(`${pathname}?${params.toString()}`);
    setPresetsOpen(false);
  };

  const handlePresetSelect = (presetKey: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (presetKey === "7d") {
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      applyRange(past, todayStr);
    } else if (presetKey === "30d") {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      applyRange(past, todayStr);
    } else if (presetKey === "90d") {
      const past = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      applyRange(past, todayStr);
    } else if (presetKey === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      applyRange(firstDay, todayStr);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick Presets Dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPresetsOpen(!presetsOpen)}
          className="gap-2 border-slate-200 dark:border-slate-800 text-xs font-medium"
        >
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Presets</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </Button>

        {presetsOpen && (
          <div className="absolute right-0 sm:right-auto left-0 mt-1 z-30 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 text-xs">
            <button
              onClick={() => handlePresetSelect("7d")}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>Last 7 Days</span>
            </button>
            <button
              onClick={() => handlePresetSelect("30d")}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>Last 30 Days</span>
            </button>
            <button
              onClick={() => handlePresetSelect("90d")}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>Last 90 Days</span>
            </button>
            <button
              onClick={() => handlePresetSelect("thisMonth")}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>This Month</span>
            </button>
          </div>
        )}
      </div>

      {/* Manual Date Input Range */}
      <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-800 dark:bg-slate-900">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-transparent text-slate-700 outline-none dark:text-slate-200 cursor-pointer"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bg-transparent text-slate-700 outline-none dark:text-slate-200 cursor-pointer"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => applyRange(from, to)}
          className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          title="Apply Date Range"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
