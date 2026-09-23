"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { getClientsAction, deleteClientAction } from "@/app/actions/clients";
import { Client } from "@/types";
import Link from "next/link";
import { Plus, Globe, ExternalLink, Trash2, Loader2, Users, Plug, ShieldAlert } from "lucide-react";
import { ToastBanner, ToastMessage } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchClients = useCallback(async () => {
    const res = await getClientsAction();
    if (res.data) {
      setClients(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const res = await getClientsAction();
      if (!ignore && res.data) {
        setClients(res.data);
      }
      if (!ignore) setLoading(false);
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteClientAction(clientToDelete.id);
      if (res.error) {
        setToast({
          id: Date.now().toString(),
          type: "error",
          title: "Delete Failed",
          description: res.error,
        });
      } else {
        setToast({
          id: Date.now().toString(),
          type: "success",
          title: "Client Removed",
          description: `${clientToDelete.name} and associated records were deleted.`,
        });
        setClientToDelete(null);
        fetchClients();
      }
    } catch {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting the client.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastBanner message={toast} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Clients
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your client accounts, branding, and connected reporting channels.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <AddClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClientAdded={fetchClients}
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="You don't have any clients yet"
          description="Get started by adding your first client account to generate automated performance reports."
          actionLabel="Add First Client"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold dark:bg-slate-800 dark:text-slate-200">
                    {client.name[0].toUpperCase()}
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    {client.currency}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold mt-3">{client.name}</CardTitle>
                <CardDescription className="text-xs">{client.industry || "General Client"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                {client.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate"
                    >
                      {client.website.replace("https://", "").replace("http://", "")}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 text-[11px]">
                  <span>TZ: {client.timezone}</span>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/clients/${client.id}/integrations`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px] gap-1 text-slate-700 dark:text-slate-300"
                      >
                        <Plug className="h-3 w-3 text-blue-600" />
                        Integrations
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      onClick={() => setClientToDelete(client)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Destructive Action Guard AlertDialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Delete Client Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong className="text-slate-900 dark:text-slate-100">{clientToDelete?.name}</strong>{" "}
              and all associated marketing metrics, connected integrations, generated reports, and public sharing links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
