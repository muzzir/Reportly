"use client";

import { useState } from "react";
import { Building2, Calendar, FileText } from "lucide-react";

interface AgencyBranding {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  website?: string | null;
}

interface ReportHeaderProps {
  agency: AgencyBranding;
  clientName: string;
  startDate: string;
  endDate: string;
  title?: string;
}

export function ReportHeader({
  agency,
  clientName,
  startDate,
  endDate,
  title = "Client Performance Overview",
}: ReportHeaderProps) {
  const [imageError, setImageError] = useState(false);

  const brandColor = agency.primary_color || "#2563eb";

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden relative"
      style={{
        borderTop: `4px solid ${brandColor}`,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Agency Branding & Report Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {agency.logo_url && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agency.logo_url}
                alt={`${agency.name} logo`}
                crossOrigin="anonymous"
                className="h-10 max-w-[180px] object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: brandColor }}
              >
                {agency.name ? agency.name.charAt(0).toUpperCase() : <Building2 className="h-5 w-5" />}
              </div>
            )}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {agency.name}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                {title}
              </h2>
            </div>
          </div>
        </div>

        {/* Right Side: Client & Date Details */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Client
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {clientName}
            </div>
          </div>

          <div className="hidden sm:block h-8 w-[1px] bg-slate-200 dark:bg-slate-700" />

          <div>
            <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Reporting Period
            </div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {startDate} – {endDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
