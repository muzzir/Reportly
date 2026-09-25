"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileBarChart2,
  Plug,
  Settings,
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
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card text-card-foreground">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-foreground">
            Reportly
          </span>
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Agency Edition
          </span>
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
