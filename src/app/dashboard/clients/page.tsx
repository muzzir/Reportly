"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { getClientsAction, deleteClientAction } from "@/app/actions/clients";
import { Client } from "@/types";
import { Plus, Globe, ExternalLink, Trash2, Loader2, Users } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    setDeletingId(id);
    await deleteClientAction(id);
    setDeletingId(null);
    fetchClients();
  };

  return (
    <div className="space-y-6">
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
        <Card className="border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No clients added yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Get started by adding your first client account to generate performance reports.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add First Client
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold dark:bg-slate-800 dark:text-slate-200">
                    {client.name[0]}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    onClick={() => handleDelete(client.id)}
                    disabled={deletingId === client.id}
                  >
                    {deletingId === client.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
