"use client";

import { useEffect, useState } from "react";
import { Building2, ChevronDown, Bell, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { getAgencyAction, AgencyWithUser } from "@/app/actions/agency";

export function Header() {
  const router = useRouter();
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

  const handleLogout = async () => {
    await signOutAction();
    router.push("/login");
    router.refresh();
  };

  const agencyName = agency?.name || "Reportly Workspace";
  const firstLetter = agencyName.charAt(0).toUpperCase();
  const userDisplayName = agency?.userEmail ? agency.userEmail.split("@")[0] : "Agency Member";

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-6 text-card-foreground">
      {/* Agency Selector */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-border bg-background font-medium text-foreground shadow-none hover:bg-accent hover:text-accent-foreground"
            >
              <div
                className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: agency?.primary_color || "#2563EB" }}
              >
                {firstLetter}
              </div>
              <span className="text-sm font-semibold">{agencyName}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card text-card-foreground border-border">
            <DropdownMenuLabel>Active Workspace</DropdownMenuLabel>
            <DropdownMenuItem className="font-medium">
              <Building2 className="mr-2 h-4 w-4 text-blue-500" />
              {agencyName}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-xs text-muted-foreground">
              Multi-tenant Workspace Active
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User & Notifications Area */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground capitalize">
                  {userDisplayName}
                </span>
                <span className="text-[10px] text-muted-foreground">Agency Member</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card text-card-foreground border-border">
            <DropdownMenuLabel>{agency?.userEmail || "My Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:bg-destructive/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
