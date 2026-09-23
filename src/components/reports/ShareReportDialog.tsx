"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateClientShareStatusAction, regeneratePublicTokenAction } from "@/app/actions/clients";
import { ToastBanner, ToastMessage } from "@/components/ui/toast";
import { Share2, Copy, RefreshCw, Check, Globe, ShieldAlert, Loader2 } from "lucide-react";

interface ShareReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  publicToken: string;
  isPublicSharingEnabled: boolean;
  onTokenRegenerated?: (newToken: string) => void;
  onSharingToggled?: (enabled: boolean) => void;
}

export function ShareReportDialog({
  isOpen,
  onOpenChange,
  clientId,
  clientName,
  publicToken,
  isPublicSharingEnabled,
  onTokenRegenerated,
  onSharingToggled,
}: ShareReportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareableUrl = origin ? `${origin}/p/${publicToken}` : `/p/${publicToken}`;

  const handleToggleSharing = async (checked: boolean) => {
    try {
      setIsToggling(true);
      if (onSharingToggled) onSharingToggled(checked);

      const res = await updateClientShareStatusAction(clientId, checked);

      if (res.error) {
        if (onSharingToggled) onSharingToggled(!checked);
        setToast({
          id: "toggle-err",
          type: "error",
          title: "Update Failed",
          description: res.error,
        });
      } else {
        setToast({
          id: "toggle-success",
          type: "success",
          title: checked ? "Public Sharing Enabled" : "Public Sharing Disabled",
          description: checked
            ? "Clients can now view the live dashboard via the public link."
            : "Public access to this report has been disabled.",
        });
      }
    } catch (err) {
      if (onSharingToggled) onSharingToggled(!checked);
      setToast({
        id: "toggle-catch-err",
        type: "error",
        title: "An error occurred",
        description: err instanceof Error ? err.message : "Failed to update status.",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setToast({
        id: "copy-success",
        type: "success",
        title: "Link Copied!",
        description: "Public report link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleRegenerateToken = async () => {
    if (
      !confirm(
        "Are you sure you want to regenerate the share link? Anyone using the old link will lose access immediately."
      )
    ) {
      return;
    }

    try {
      setIsRegenerating(true);
      const res = await regeneratePublicTokenAction(clientId);

      if (res.error) {
        setToast({
          id: "regen-err",
          type: "error",
          title: "Regeneration Failed",
          description: res.error,
        });
      } else if (res.data?.public_token) {
        const newToken = res.data.public_token;
        if (onTokenRegenerated) onTokenRegenerated(newToken);
        setToast({
          id: "regen-success",
          type: "success",
          title: "Share Link Regenerated",
          description: "New randomized public URL created. Old link is revoked.",
        });
      }
    } catch (err) {
      setToast({
        id: "regen-catch-err",
        type: "error",
        title: "An error occurred",
        description: err instanceof Error ? err.message : "Failed to regenerate token.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <ToastBanner message={toast} onClose={() => setToast(null)} />

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Share2 className="h-5 w-5" />
              <DialogTitle>Share Live Client Portal</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Provide {clientName} with a secure live report link (no login required).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Sharing Toggle Banner */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Enable Public Sharing
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isPublicSharingEnabled ? "Link is active" : "Link access disabled"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isToggling && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                <Switch checked={isPublicSharingEnabled} onCheckedChange={handleToggleSharing} />
              </div>
            </div>

            {/* URL Display & Copy */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Public Shareable URL
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="font-mono text-xs bg-slate-50 dark:bg-slate-900/50 select-all"
                />
                <Button
                  onClick={handleCopyLink}
                  disabled={!isPublicSharingEnabled}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Security Note & Regenerate Option */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-[11px] leading-relaxed">
                  Anyone with this randomized link can view live read-only report analytics for {clientName}.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateToken}
                  disabled={isRegenerating}
                  className="h-7 text-[11px] border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 gap-1.5"
                >
                  {isRegenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  <span>Regenerate Link Token</span>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
