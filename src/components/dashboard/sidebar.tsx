"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileBarChart2,
  Plug,
  Settings,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navigationItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileBarChart2,
  },
  {
    name: "Integrations",
    href: "/dashboard/integrations",
    icon: Plug,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white">
            Reportly
          </span>
          <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
            Agency Edition
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1 px-3 py-4">
        <div className="px-3 py-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Navigation
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Status */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-200">Phase 1 Foundation</span>
            <span className="text-[11px] text-slate-400">Multi-tenant ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
