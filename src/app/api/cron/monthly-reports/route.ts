import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { getClientMetrics } from "@/lib/queries/metrics";
import { generateMonthlySummaryEmailHtml } from "@/lib/email/MonthlySummaryEmail";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // 1. Authorization Security Guard
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Check if CRON_SECRET is set and requires validation
    if (cronSecret && cronSecret !== "your_cron_secret_here") {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized cron access." },
          { status: 401 }
        );
      }
    }

    // 2. Calculate Date Range for Previous Calendar Month
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;

    const firstDay = new Date(Date.UTC(year, prevMonthIdx, 1));
    const lastDay = new Date(Date.UTC(year, prevMonthIdx + 1, 0));

    const startDate = firstDay.toISOString().split("T")[0];
    const endDate = lastDay.toISOString().split("T")[0];

    const supabase = await createClient();

    // 3. Query Clients with Automation Enabled
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*, agencies(*)")
      .eq("auto_report_enabled", true);

    if (clientsError) {
      return NextResponse.json(
        { error: `Database query error: ${clientsError.message}` },
        { status: 500 }
      );
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No clients currently have automated reporting enabled.",
        period: { startDate, endDate },
        processed: 0,
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const isMockMode =
      !apiKey || apiKey.startsWith("re_your_") || apiKey.startsWith("re_mock");
    const resend = isMockMode ? null : new Resend(apiKey);
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 4. Batch Process Clients using Promise.allSettled
    const results = await Promise.allSettled(
      clients.map(async (client) => {
        // Query previous month's marketing metrics
        const metricsData = await getClientMetrics(client.id, startDate, endDate);

        // Resolve agency details
        const agency = Array.isArray(client.agencies)
          ? client.agencies[0]
          : client.agencies;

        const agencyName = agency?.name || "Marketing Agency";
        const agencyLogoUrl = agency?.logo_url || null;
        const agencyColor = agency?.primary_color || "#0F172A";

        // Determine recipient email list
        const autoEmails = client.auto_report_emails as string[] | null;
        const recipients =
          autoEmails && autoEmails.length > 0
            ? autoEmails
            : [`contact@${client.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`];

        const reportUrl = `${appBaseUrl}/dashboard/clients/${client.id}/reports?from=${startDate}&to=${endDate}`;

        const emailHtml = generateMonthlySummaryEmailHtml({
          agencyName,
          agencyLogoUrl,
          agencyColor,
          clientName: client.name,
          startDate,
          endDate,
          kpis: metricsData.kpis,
          reportUrl,
        });

        const subject = `[${agencyName}] Monthly Performance Summary: ${client.name} (${startDate} – ${endDate})`;

        if (isMockMode) {
          console.log("[MOCK CRON EMAIL DISPATCH]", {
            clientId: client.id,
            clientName: client.name,
            recipients,
            subject,
          });
        } else if (resend) {
          await resend.emails.send({
            from: `${agencyName} <onboarding@resend.dev>`,
            to: recipients,
            subject,
            html: emailHtml,
          });
        }

        // Update client's last_report_sent_at timestamp
        await supabase
          .from("clients")
          .update({
            last_report_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", client.id);

        return {
          clientId: client.id,
          clientName: client.name,
          recipients,
          status: "sent",
          mocked: isMockMode,
        };
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      period: { startDate, endDate },
      totalEligible: clients.length,
      succeeded,
      failed,
      results: results.map((r) =>
        r.status === "fulfilled"
          ? r.value
          : { status: "failed", reason: (r as PromiseRejectedResult).reason?.message }
      ),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Cron execution failed.";
    await logger.error("monthly_cron", errorMsg);
    return NextResponse.json(
      {
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
