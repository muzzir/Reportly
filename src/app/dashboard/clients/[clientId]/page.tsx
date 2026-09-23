import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientAutomationCard } from "@/components/clients/ClientAutomationCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Plug } from "lucide-react";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link
            href="/dashboard/clients"
            className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Clients
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {client.name}
          </span>
        </div>

        {/* Client Profile Summary Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xl shadow-xs">
              {client.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {client.name}
                </h1>
                <Badge variant="secondary" className="text-xs">
                  {client.currency}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                <span>Industry: {client.industry || "General"}</span>
                <span>•</span>
                <span>Timezone: {client.timezone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/dashboard/clients/${clientId}/integrations`}>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Plug className="h-3.5 w-3.5 text-blue-600" />
                <span>Manage Integrations</span>
              </Button>
            </Link>
            <Link href={`/dashboard/clients/${clientId}/reports`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>View Reports & Analytics</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Client Automation Settings */}
      <div className="max-w-2xl">
        <ClientAutomationCard client={client} />
      </div>
    </div>
  );
}
