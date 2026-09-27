"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createReportAction } from "@/app/actions/reports";
import { Client } from "@/types";
import { FileText, Loader2 } from "lucide-react";

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onReportCreated?: () => void;
}

export function CreateReportDialog({ open, onOpenChange, clients, onReportCreated }: CreateReportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    client_id: clients[0]?.id || "",
    title: "",
    period_start: firstDayOfMonthStr,
    period_end: todayStr,
    status: "draft" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const selectedClient = clients.find((c) => c.id === (formData.client_id || clients[0]?.id));
    if (!selectedClient) {
      setError("Please select or create a client first.");
      setLoading(false);
      return;
    }

    const reportTitle = formData.title.trim() || `${selectedClient.name} Performance Audit`;

    const res = await createReportAction({
      client_id: selectedClient.id,
      title: reportTitle,
      period_start: formData.period_start,
      period_end: formData.period_end,
      status: "draft",
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setFormData({
        client_id: clients[0]?.id || "",
        title: "",
        period_start: firstDayOfMonthStr,
        period_end: todayStr,
        status: "draft",
      });
      onOpenChange(false);
      if (onReportCreated) onReportCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Create Draft Report
          </DialogTitle>
          <DialogDescription className="text-xs">
            Generate a performance report draft for your client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Target Client <span className="text-destructive">*</span>
            </label>
            <select
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              value={formData.client_id || clients[0]?.id || ""}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            >
              {clients.length === 0 && <option value="">No clients found (Add client first)</option>}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industry || "Client"})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Report Title
            </label>
            <Input
              placeholder="e.g. Monthly Performance Audit"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Period Start
              </label>
              <Input
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Period End
              </label>
              <Input
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              />
            </div>
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
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Draft Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
