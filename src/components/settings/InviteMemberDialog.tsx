"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Loader2, ShieldCheck, User } from "lucide-react";
import { inviteTeamMemberAction } from "@/app/actions/team";
import { UserRole } from "@/types";

interface InviteMemberDialogProps {
  onSuccess?: () => void;
}

export function InviteMemberDialog({ onSuccess }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await inviteTeamMemberAction({
        email: email.trim(),
        role,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage(`Invitation sent to ${email} as ${role.toUpperCase()}.`);
        setEmail("");
        setRole("member");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setOpen(false);
          setSuccessMessage(null);
        }, 1500);
      }
    } catch {
      setError("Failed to invite team member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Invite Team Member</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an email invitation to add a teammate to your Reportly workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
              {successMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="invite-role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Workspace Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  role === "admin"
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-200 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Admin
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Full access to clients, reports, billing & team settings.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("member")}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  role === "member"
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-200 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  Member
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Can view and edit clients and reports. Restricted from billing & team settings.
                </span>
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
