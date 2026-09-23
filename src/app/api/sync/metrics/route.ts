import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncMetricsSchema } from "@/lib/validations/sync";
import { getValidAccessToken } from "@/lib/integrations/auth";
import { fetchGoogleAdsMetrics } from "@/lib/integrations/providers/google-ads";
import { fetchMetaAdsMetrics } from "@/lib/integrations/providers/meta-ads";
import { fetchGA4Metrics } from "@/lib/integrations/providers/ga4";
import {
  NormalizedMetric,
  normalizeGoogleAdsData,
  normalizeMetaAdsData,
  normalizeGA4Data,
} from "@/lib/integrations/normalizer";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const validation = syncMetricsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { clientId } = validation.data;
    const todayStr = new Date().toISOString().split("T")[0];
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const startDate = validation.data.startDate || thirtyDaysAgoStr;
    const endDate = validation.data.endDate || todayStr;

    const supabase = await createClient();

    // Verify authenticated session or dev bypass
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // If logged in, verify agency access to this client
      const { data: client } = await supabase
        .from("clients")
        .select("agency_id")
        .eq("id", clientId)
        .single();

      if (client) {
        const { data: member } = await supabase
          .from("agency_members")
          .select("agency_id")
          .eq("user_id", user.id)
          .eq("agency_id", client.agency_id)
          .single();

        if (!member) {
          return NextResponse.json(
            { error: "Unauthorized access to client data" },
            { status: 403 }
          );
        }
      }
    }

    // 1. Fetch active integrations for target client
    const { data: integrations, error: fetchError } = await supabase
      .from("integrations")
      .select("*")
      .eq("client_id", clientId);

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to retrieve client integrations: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        syncedRecords: 0,
        processedIntegrations: 0,
        message: "No connected integrations found for this client.",
        warnings: [],
      });
    }

    const allNormalizedMetrics: NormalizedMetric[] = [];
    const warnings: string[] = [];

    // 2. Iterate through each integration, retrieve token, fetch metrics, and normalize
    for (const integration of integrations) {
      try {
        const tokenRes = await getValidAccessToken(integration.id);

        if (tokenRes.error || !tokenRes.accessToken) {
          warnings.push(
            `Skipped ${integration.provider} (${integration.id}): ${tokenRes.error || "No valid access token"}`
          );
          continue;
        }

        const accessToken = tokenRes.accessToken;
        const externalAccountId = tokenRes.externalAccountId || "default_acc";

        if (integration.provider === "google_ads") {
          const rawRows = await fetchGoogleAdsMetrics(
            accessToken,
            externalAccountId,
            startDate,
            endDate
          );
          const normalized = normalizeGoogleAdsData(rawRows, clientId, integration.id);
          allNormalizedMetrics.push(...normalized);
        } else if (integration.provider === "meta_ads") {
          const rawRows = await fetchMetaAdsMetrics(
            accessToken,
            externalAccountId,
            startDate,
            endDate
          );
          const normalized = normalizeMetaAdsData(rawRows, clientId, integration.id);
          allNormalizedMetrics.push(...normalized);
        } else if (integration.provider === "ga4") {
          const rawRows = await fetchGA4Metrics(
            accessToken,
            externalAccountId,
            startDate,
            endDate
          );
          const normalized = normalizeGA4Data(rawRows, clientId, integration.id);
          allNormalizedMetrics.push(...normalized);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        warnings.push(`Error syncing ${integration.provider} (${integration.id}): ${errMsg}`);
      }
    }

    // 3. Upsert normalized metrics into Supabase database table
    if (allNormalizedMetrics.length > 0) {
      const { error: upsertError } = await supabase
        .from("marketing_metrics")
        .upsert(allNormalizedMetrics as never[], {
          onConflict: "integration_id,date,campaign_name",
        });

      if (upsertError) {
        console.error("Marketing metrics upsert error:", upsertError);
        return NextResponse.json(
          {
            error: `Failed to persist metrics to database: ${upsertError.message}`,
            syncedRecords: 0,
            warnings,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      syncedRecords: allNormalizedMetrics.length,
      processedIntegrations: integrations.length,
      warnings,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("Unhandled error in /api/sync/metrics:", error);
    await logger.error("metrics_sync", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
