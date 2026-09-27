"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileBarChart2,
  Plug,
  Settings,
  BarChart3,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getAgencyAction, AgencyWithUser } from "@/app/actions/agency";
import { Badge } from "@/components/ui/badge";

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
  const [agency, setAgency] = useState<AgencyWithUser | null>(null);

  useEffect(() => {
    async function loadAgency() {
      const res = await getAgencyAction();
      if (res.data) {
        setAgency(res.data);
      }
    }
    loadAgency();
  }, []);

  const agencyName = agency?.name || "Reportly";
  const planTier = (agency?.plan_tier || "normal").toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card text-card-foreground">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3 truncate">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-xs font-bold text-sm"
            style={{ backgroundColor: agency?.primary_color || undefined }}
          >
            {agency?.logo_url ? (
              <img src={agency.logo_url} alt={agencyName} className="h-6 w-6 object-contain rounded" />
            ) : (
              agencyName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-bold tracking-tight text-foreground truncate">
              {agencyName}
            </span>
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-blue-500" />
              {planTier} PLAN
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1 px-3 py-4">
        <div className="px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
