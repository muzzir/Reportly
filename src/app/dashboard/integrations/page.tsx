"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectIntegrationDialog } from "@/components/integrations/connect-integration-dialog";
import { getIntegrationsAction, deleteIntegrationAction } from "@/app/actions/integrations";
import { Integration, IntegrationProvider } from "@/types";
import { Plug, ShieldCheck, Loader2, Trash2, ShieldAlert } from "lucide-react";
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

const providers: {
  id: IntegrationProvider;
  name: string;
  description: string;
  category: string;
}[] = [
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Import campaign performance, impressions, clicks, cost-per-lead, and conversion metrics.",
    category: "Paid Search & Display",
  },
  {
    id: "meta_ads",
    name: "Meta Ads (Facebook & Instagram)",
    description: "Sync social ad spend, ROAS, click-through rates, demographic insights, and creative analytics.",
    category: "Paid Social",
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Track user traffic, engagement rate, event conversions, channel attribution, and session duration.",
    category: "Web Analytics",
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [selectedProviderName, setSelectedProviderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [integrationToDisconnect, setIntegrationToDisconnect] = useState<{ id: string; name: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchIntegrations = useCallback(async () => {
    const res = await getIntegrationsAction();
    if (res.data) {
      setIntegrations(res.data);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const res = await getIntegrationsAction();
      if (!ignore && res.data) {
        setIntegrations(res.data);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenConnect = (providerId: IntegrationProvider, name: string) => {
    setSelectedProvider(providerId);
    setSelectedProviderName(name);
    setDialogOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!integrationToDisconnect) return;
    setDisconnecting(true);
    try {
      const res = await deleteIntegrationAction(integrationToDisconnect.id);
      if (res.error) {
        setToast({
          id: Date.now().toString(),
          type: "error",
          title: "Disconnect Failed",
          description: res.error,
        });
      } else {
        setToast({
          id: Date.now().toString(),
          type: "success",
          title: "Integration Disconnected",
          description: `${integrationToDisconnect.name} was disconnected successfully.`,
        });
        setIntegrationToDisconnect(null);
        fetchIntegrations();
      }
    } catch {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Disconnect Failed",
        description: "An unexpected error occurred while disconnecting integration.",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastBanner message={toast} onClose={() => setToast(null)} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Marketing Data Integrations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Connect marketing ad platforms and analytics engines to power automated reporting.
        </p>
      </div>

      <ConnectIntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provider={selectedProvider}
        providerName={selectedProviderName}
        onConnected={fetchIntegrations}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {providers.map((provider) => {
          const activeIntegration = integrations.find((i) => i.provider === provider.id);

          return (
            <Card key={provider.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <Plug className="h-5 w-5" />
                  </div>
                  <Badge variant={activeIntegration ? "success" : "outline"} className="text-[11px]">
                    {activeIntegration ? "Connected" : provider.category}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold mt-3">{provider.name}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{provider.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Encrypted AES-256
                  </span>
                  {activeIntegration ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 dark:border-red-900"
                      onClick={() => setIntegrationToDisconnect({ id: activeIntegration.id, name: provider.name })}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleOpenConnect(provider.id, provider.name)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disconnect Integration AlertDialog */}
      <AlertDialog open={!!integrationToDisconnect} onOpenChange={(open) => !open && setIntegrationToDisconnect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Disconnect Data Integration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect{" "}
              <strong className="text-slate-900 dark:text-slate-100">{integrationToDisconnect?.name}</strong>?
              This will stop automatic daily metrics syncs for this platform across all client accounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisconnect}
              disabled={disconnecting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Confirm Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
