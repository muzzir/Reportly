"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  User,
  Trash2,
  Loader2,
  Crown,
} from "lucide-react";
import { updateMemberRoleAction, removeMemberAction } from "@/app/actions/team";
import { TeamMemberDetails, UserRole } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TeamManagementTableProps {
  members: TeamMemberDetails[];
  currentUserRole: UserRole;
  onRefresh: () => void;
}

export function TeamManagementTable({
  members,
  currentUserRole,
  onRefresh,
}: TeamManagementTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberDetails | null>(null);

  const canManage = ["owner", "admin"].includes(currentUserRole);

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setActionLoading(memberId);
    setError(null);
    try {
      const res = await updateMemberRoleAction({ memberId, role: newRole });
      if (res.error) {
        setError(res.error);
      } else {
        onRefresh();
      }
    } catch {
      setError("Failed to update member role.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    const memberId = memberToRemove.id;
    setActionLoading(memberId);
    setError(null);
    try {
      const res = await removeMemberAction({ memberId });
      if (res.error) {
        setError(res.error);
      } else {
        setMemberToRemove(null);
        onRefresh();
      }
    } catch {
      setError("Failed to remove team member.");
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "owner":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20 gap-1">
            <Crown className="h-3 w-3 text-amber-500" />
            Owner
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20 gap-1">
            <ShieldCheck className="h-3 w-3 text-blue-600" />
            Admin
          </Badge>
        );
      case "member":
      default:
        return (
          <Badge variant="outline" className="text-slate-600 dark:text-slate-400 gap-1">
            <User className="h-3 w-3 text-slate-400" />
            Member
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
            <TableRow>
              <TableHead className="w-[300px]">Team Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined Date</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-sm">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const isLoading = actionLoading === member.id;

                return (
                  <TableRow key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 shrink-0">
                          {member.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {member.email}
                            {member.is_current_user && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ID: {member.user_id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{getRoleBadge(member.role)}</TableCell>

                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(member.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>

                    {canManage && (
                      <TableCell className="text-right">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400 ml-auto" />
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Manage Role</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member.id, "owner")}
                                disabled={member.role === "owner" || currentUserRole !== "owner"}
                                className="text-xs"
                              >
                                <Crown className="mr-2 h-3.5 w-3.5 text-amber-500" />
                                Make Owner
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member.id, "admin")}
                                disabled={member.role === "admin"}
                                className="text-xs"
                              >
                                <ShieldCheck className="mr-2 h-3.5 w-3.5 text-blue-600" />
                                Make Admin
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member.id, "member")}
                                disabled={member.role === "member"}
                                className="text-xs"
                              >
                                <User className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                Make Member
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setMemberToRemove(member)}
                                className="text-xs text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Remove Team Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 dark:text-slate-100">{memberToRemove?.email}</strong>{" "}
              from your agency workspace? This will immediately revoke their database permissions and dashboard access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberToRemove(null)}
              disabled={!!actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRemoveMember}
              disabled={!!actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Confirm Removal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
