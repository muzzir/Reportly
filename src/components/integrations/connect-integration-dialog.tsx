"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectIntegrationAction } from "@/app/actions/integrations";
import { IntegrationProvider } from "@/types";
import { Plug, ShieldCheck, Loader2 } from "lucide-react";

interface ConnectIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: IntegrationProvider | null;
  providerName: string;
  onConnected?: () => void;
}

export function ConnectIntegrationDialog({
  open,
  onOpenChange,
  provider,
  providerName,
  onConnected,
}: ConnectIntegrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [externalAccountId, setExternalAccountId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    setLoading(true);
    setError(null);

    const res = await connectIntegrationAction(provider, externalAccountId || "act_1029384756");
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setExternalAccountId("");
      onOpenChange(false);
      if (onConnected) onConnected();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-blue-600" />
            Connect {providerName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Authorize Reportly to aggregate analytics data from your {providerName} account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              AES-256-GCM Token Encryption
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              OAuth access tokens and refresh tokens will be encrypted at rest using server-side keys.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {providerName} Account / Property ID
            </label>
            <Input
              placeholder={
                provider === "google_ads"
                  ? "e.g. 123-456-7890"
                  : provider === "meta_ads"
                  ? "e.g. act_987654321"
                  : "e.g. properties/314159265"
              }
              value={externalAccountId}
              onChange={(e) => setExternalAccountId(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Authorize & Encrypt Tokens
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
