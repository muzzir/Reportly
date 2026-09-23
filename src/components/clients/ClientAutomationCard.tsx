"use client";

import { useState } from "react";
import { Client } from "@/types";
import { updateClientAutomationAction } from "@/app/actions/clients";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToastBanner, ToastMessage } from "@/components/ui/toast";
import { CalendarClock, Mail, Save, Loader2, Clock } from "lucide-react";

interface ClientAutomationCardProps {
  client: Client;
  onUpdate?: () => void;
}

export function ClientAutomationCard({ client, onUpdate }: ClientAutomationCardProps) {
  const [enabled, setEnabled] = useState(client.auto_report_enabled ?? false);
  const [emailsText, setEmailsText] = useState(
    Array.isArray(client.auto_report_emails) ? client.auto_report_emails.join(", ") : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse email list
    const emailsList = emailsText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Validate email format
    const invalidEmail = emailsList.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (enabled && invalidEmail) {
      setToast({
        id: "email-invalid-err",
        type: "error",
        title: "Invalid Email Address",
        description: `"${invalidEmail}" is not a valid email address.`,
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateClientAutomationAction(client.id, enabled, emailsList);

      if (res.error) {
        setToast({
          id: "automation-save-err",
          type: "error",
          title: "Update Failed",
          description: res.error,
        });
      } else {
        setToast({
          id: "automation-save-success",
          type: "success",
          title: "Automation Preferences Saved",
          description: enabled
            ? "Monthly automated reporting is now enabled for this client."
            : "Automated monthly reporting disabled.",
        });
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      setToast({
        id: "automation-catch-err",
        type: "error",
        title: "An error occurred",
        description: err instanceof Error ? err.message : "Failed to update preferences.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formattedLastSent = client.last_report_sent_at
    ? new Date(client.last_report_sent_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <>
      <ToastBanner message={toast} onClose={() => setToast(null)} />

      <form onSubmit={handleSave}>
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Automated Monthly Reporting
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Dispatches a white-labeled summary email on the 1st of every month.
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {enabled ? "Enabled" : "Disabled"}
                </span>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Recipient Emails */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Report Recipient Emails (Comma Separated)
              </label>
              <Input
                type="text"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                placeholder="client.exec@company.com, marketing@company.com"
                className="text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Multiple email addresses can be added separated by commas.
              </p>
            </div>

            {/* Last Sent Information */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Last Automated Report Dispatch:</span>
              </div>
              <span className="font-medium text-slate-900 dark:text-slate-200">
                {formattedLastSent}
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 font-medium"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Automation Settings</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  );
}
