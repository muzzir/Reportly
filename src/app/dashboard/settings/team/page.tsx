import { getTeamMembersAction } from "@/app/actions/team";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { TeamManagementTable } from "@/components/settings/TeamManagementTable";
import { InviteMemberDialog } from "@/components/settings/InviteMemberDialog";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function TeamSettingsPage() {
  const { members, userRole, error } = await getTeamMembersAction();

  const handleRefresh = async () => {
    "use server";
    revalidatePath("/dashboard/settings/team");
  };

  const isMember = userRole === "member";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Agency Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your agency team members, permissions, and workspace access.
        </p>
      </div>

      <SettingsNavTabs userRole={userRole} />

      {error ? (
        <Card className="border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20 max-w-2xl">
          <CardContent className="flex items-center gap-3 p-0 text-red-900 dark:text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium">{error}</p>
          </CardContent>
        </Card>
      ) : isMember ? (
        <Card className="border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20 max-w-2xl">
          <CardContent className="flex items-center gap-3 p-0 text-amber-900 dark:text-amber-200">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-sm">Access Restricted</h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                You currently have the <strong className="capitalize">{userRole}</strong> role. Only agency Owners and Admins can view or manage team members.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Workspace Members ({members.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invited users can access your agency dashboard based on assigned roles.
              </p>
            </div>

            <InviteMemberDialog />
          </div>

          <TeamManagementTable
            members={members}
            currentUserRole={userRole || "member"}
            onRefresh={handleRefresh}
          />
        </div>
      )}
    </div>
  );
}
