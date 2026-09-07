import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Agency Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure your agency branding, default report preferences, and team settings.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-semibold">Agency Profile</CardTitle>
            </div>
            <CardDescription className="text-xs">
              This information appears on generated PDF reports sent to your clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Agency Name
              </label>
              <Input defaultValue="Apex Marketing Agency" placeholder="Enter agency name" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Website URL
              </label>
              <Input defaultValue="https://apexmarketing.example.com" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    defaultValue="#0F172A"
                    className="h-9 w-12 cursor-pointer rounded border border-slate-200 p-1"
                  />
                  <Input defaultValue="#0F172A" className="font-mono text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Agency Logo URL
                </label>
                <Input defaultValue="https://apexmarketing.example.com/logo.png" placeholder="https://..." />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
