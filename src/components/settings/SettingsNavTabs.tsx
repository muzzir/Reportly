"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SettingsNavTabs({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname();

  const isBrandingActive = pathname === "/dashboard/settings";
  const isTeamActive = pathname === "/dashboard/settings/team";

  const isMember = userRole === "member";

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <Link
          href="/dashboard/settings"
          className={cn(
            "inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors",
            isBrandingActive
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Building2 className="h-4 w-4" />
          <span>Agency & Branding</span>
        </Link>

        {!isMember && (
          <Link
            href="/dashboard/settings/team"
            className={cn(
              "inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors",
              isTeamActive
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Users className="h-4 w-4" />
            <span>Team Members</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
