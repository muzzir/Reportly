"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectIntegrationDialog } from "@/components/integrations/connect-integration-dialog";
import { getIntegrationsAction, deleteIntegrationAction } from "@/app/actions/integrations";
import { Integration, IntegrationProvider } from "@/types";
import { Plug, ShieldCheck, Loader2, Trash2 } from "lucide-react";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) return;
    setDeletingId(id);
    await deleteIntegrationAction(id);
    setDeletingId(null);
    fetchIntegrations();
  };

  return (
    <div className="space-y-6">
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
            <Card key={provider.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between">
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
                      onClick={() => handleDisconnect(activeIntegration.id)}
                      disabled={deletingId === activeIntegration.id}
                    >
                      {deletingId === activeIntegration.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                      )}
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
    </div>
  );
}
