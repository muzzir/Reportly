"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ToastBanner, ToastMessage } from "@/components/ui/toast";
import { getClientIntegrationsAction, disconnectIntegrationAction } from "@/app/actions/integrations";
import { getClientsAction } from "@/app/actions/clients";
import { Integration, IntegrationProvider, Client } from "@/types";
import { OAUTH_PROVIDERS } from "@/lib/oauth/config";
import {
  Plug,
  ShieldCheck,
  Loader2,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  BarChart3,
} from "lucide-react";

interface ClientIntegrationsPageProps {
  params: Promise<{ clientId: string }>;
}

export default function ClientIntegrationsPage({ params }: ClientIntegrationsPageProps) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.clientId;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [client, setClient] = useState<Client | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  // Disconnect Modal state
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Syncing state
  const [syncing, setSyncing] = useState(false);

  const handleSyncMetrics = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setToast({
          id: `toast-${Date.now()}`,
          type: "error",
          title: "Sync Failed",
          description: data.error || "Failed to sync marketing metrics.",
        });
      } else {
        setToast({
          id: `toast-${Date.now()}`,
          type: "success",
          title: "Marketing Metrics Synced",
          description: `Synced ${data.syncedRecords} records from ${data.processedIntegrations} connected platforms into Supabase database.`,
        });
      }
    } catch {
      setToast({
        id: `toast-${Date.now()}`,
        type: "error",
        title: "Sync Error",
        description: "An unexpected network error occurred while syncing metrics.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const loadData = useCallback(async () => {
    const [clientsRes, integrationsRes] = await Promise.all([
      getClientsAction(),
      getClientIntegrationsAction(clientId),
    ]);

    if (clientsRes.data) {
      const foundClient = clientsRes.data.find((c) => c.id === clientId);
      setClient(foundClient || null);
    }

    if (integrationsRes.data) {
      setIntegrations(integrationsRes.data);
    }

    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      const [clientsRes, integrationsRes] = await Promise.all([
        getClientsAction(),
        getClientIntegrationsAction(clientId),
      ]);
      if (!ignore) {
        if (clientsRes.data) {
          const foundClient = clientsRes.data.find((c) => c.id === clientId);
          setClient(foundClient || null);
        }
        if (integrationsRes.data) {
          setIntegrations(integrationsRes.data);
        }
        setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [clientId]);

  // Handle URL feedback flags (success / error query params from callback)
  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    const providerParam = searchParams.get("provider");

    if (successParam === "connected") {
      const providerName = providerParam ? OAUTH_PROVIDERS[providerParam as IntegrationProvider]?.name || providerParam : "Platform";
      const timer = setTimeout(() => {
        setToast({
          id: `toast-${Date.now()}`,
          type: "success",
          title: `${providerName} Connected Successfully`,
          description: "Credentials encrypted with AES-256-GCM and saved securely to Supabase.",
        });
        router.replace(`/dashboard/clients/${clientId}/integrations`);
      }, 0);
      return () => clearTimeout(timer);
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: "OAuth authorization was cancelled or denied.",
        invalid_state: "Security verification failed (Invalid state parameter). Please try again.",
        database_save_failed: "Failed to persist OAuth credentials to the database.",
        token_exchange_failed: "Failed to exchange authorization code for tokens.",
        no_agency_access: "Unauthorized agency membership.",
      };

      const timer = setTimeout(() => {
        setToast({
          id: `toast-${Date.now()}`,
          type: "error",
          title: "Integration Failed",
          description: errorMessages[errorParam] || "An unexpected error occurred during authorization.",
        });
        router.replace(`/dashboard/clients/${clientId}/integrations`);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, clientId, router]);

  const handleConnect = (providerId: IntegrationProvider) => {
    // Initiate OAuth flow via authorize route
    router.push(`/api/integrations/${providerId}/authorize?clientId=${clientId}`);
  };

  const openDisconnectDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!selectedIntegration) return;

    setDisconnecting(true);
    const res = await disconnectIntegrationAction(selectedIntegration.id);
    setDisconnecting(false);

    if (res.error) {
      setToast({
        id: `toast-${Date.now()}`,
        type: "error",
        title: "Disconnect Failed",
        description: res.error,
      });
    } else {
      setToast({
        id: `toast-${Date.now()}`,
        type: "info",
        title: "Integration Disconnected",
        description: "Credentials revoked locally and deleted securely from the database.",
      });
      setDisconnectModalOpen(false);
      setSelectedIntegration(null);
      setLoading(true);
      loadData();
    }
  };

  const providersList: IntegrationProvider[] = ["google_ads", "meta_ads", "ga4"];

  return (
    <div className="space-y-6">
      <ToastBanner message={toast} onClose={() => setToast(null)} />

      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/dashboard/clients" className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Clients
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {client ? client.name : "Client Details"}
          </span>
          <span>/</span>
          <span>Integrations</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Integrations for {client?.name || "Client"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Connect marketing ad platforms and web analytics engines to aggregate performance data.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/clients/${clientId}/reports`}>
              <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                View Reports
              </Button>
            </Link>
            <Button
              onClick={handleSyncMetrics}
              disabled={syncing || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {syncing ? "Syncing Metrics..." : "Sync Marketing Metrics"}
            </Button>
            {process.env.NEXT_PUBLIC_MOCK_OAUTH !== "false" && (
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 gap-1 py-1 px-3">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                OAuth Developer Mock Mode Active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {providersList.map((providerKey) => {
            const providerConfig = OAUTH_PROVIDERS[providerKey];
            const activeIntegration = integrations.find((i) => i.provider === providerKey);

            // Determine state: Connected, Expired/Error, or Not Connected
            const isExpired = activeIntegration?.expires_at
              ? new Date(activeIntegration.expires_at) < new Date()
              : false;

            const isConnected = !!activeIntegration && !isExpired;
            const isError = !!activeIntegration && isExpired;

            // Extract metadata fields for UI display
            const metadata = activeIntegration?.metadata as Record<string, string> | undefined;
            const accountName = metadata?.account_name || activeIntegration?.external_account_id || "Connected Account";
            const accountEmail = metadata?.email;

            return (
              <Card key={providerKey} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold">
                      <Plug className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>

                    {isConnected && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        Connected
                      </Badge>
                    )}

                    {isError && (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        Reconnect Required
                      </Badge>
                    )}

                    {!activeIntegration && (
                      <Badge variant="secondary" className="text-[11px]">
                        Not Connected
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-base font-semibold mt-3">
                    {providerConfig.name}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {providerConfig.description}
                  </CardDescription>

                  {/* Connected Account Banner */}
                  {activeIntegration && (
                    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        Connected as {accountName}
                      </div>
                      {accountEmail && (
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                          {accountEmail}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span>Status: <strong className={isConnected ? "text-emerald-600" : "text-amber-600"}>{isConnected ? "Active" : "Expired"}</strong></span>
                        <span className="flex items-center gap-1 text-[10px]">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" /> AES-256
                        </span>
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      OAuth 2.0 Encrypted
                    </span>

                    {isConnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 dark:border-red-900 dark:hover:bg-red-950"
                        onClick={() => openDisconnectDialog(activeIntegration)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Disconnect
                      </Button>
                    )}

                    {isError && (
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
                        onClick={() => handleConnect(providerKey)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reconnect
                      </Button>
                    )}

                    {!activeIntegration && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                        onClick={() => handleConnect(providerKey)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectModalOpen} onOpenChange={setDisconnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Disconnect Integration
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to disconnect this platform? OAuth access and refresh tokens will be revoked and deleted from the database.
            </DialogDescription>
          </DialogHeader>

          {selectedIntegration && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {OAUTH_PROVIDERS[selectedIntegration.provider]?.name || selectedIntegration.provider}
              </div>
              <p className="text-slate-500">
                Account ID: {selectedIntegration.external_account_id || "N/A"}
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisconnectModalOpen(false)}
              disabled={disconnecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDisconnect}
              disabled={disconnecting}
            >
              {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
