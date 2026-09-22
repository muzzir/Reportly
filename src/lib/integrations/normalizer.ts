import { GoogleAdsMetricsRow } from "./providers/google-ads";
import { MetaAdsInsightRow } from "./providers/meta-ads";
import { GA4ReportRow } from "./providers/ga4";

export interface NormalizedMetric {
  client_id: string;
  integration_id: string;
  date: string; // YYYY-MM-DD
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

/**
 * Normalizes Google Ads GAQL report rows into standard NormalizedMetric objects.
 * Converts cost_micros (divide by 1,000,000) to standard currency units.
 */
export function normalizeGoogleAdsData(
  rawData: GoogleAdsMetricsRow[],
  clientId: string,
  integrationId: string
): NormalizedMetric[] {
  return rawData.map((row) => ({
    client_id: clientId,
    integration_id: integrationId,
    date: row.segments?.date || new Date().toISOString().split("T")[0],
    campaign_name: row.campaign?.name || "Google Ads Campaign",
    spend: Number(((row.metrics?.cost_micros || 0) / 1000000).toFixed(4)),
    impressions: Number(row.metrics?.impressions || 0),
    clicks: Number(row.metrics?.clicks || 0),
    conversions: Number((row.metrics?.conversions || 0).toFixed(4)),
  }));
}

/**
 * Normalizes Meta Ads Graph API insight rows into standard NormalizedMetric objects.
 * Parses string representations of spend, impressions, clicks, and conversions.
 */
export function normalizeMetaAdsData(
  rawData: MetaAdsInsightRow[],
  clientId: string,
  integrationId: string
): NormalizedMetric[] {
  return rawData.map((row) => {
    // Extract conversions from actions array if not directly provided
    let conv = parseFloat(row.conversions || "0");
    if (!conv && row.actions) {
      const purchaseAction = row.actions.find(
        (a) => a.action_type === "offsite_conversion.fb_pixel_purchase" || a.action_type === "purchase"
      );
      if (purchaseAction) {
        conv = parseFloat(purchaseAction.value || "0");
      }
    }

    return {
      client_id: clientId,
      integration_id: integrationId,
      date: row.date_start || new Date().toISOString().split("T")[0],
      campaign_name: row.campaign_name || "Meta Ads Campaign",
      spend: Number(parseFloat(row.spend || "0").toFixed(4)),
      impressions: parseInt(row.impressions || "0", 10),
      clicks: parseInt(row.clicks || "0", 10),
      conversions: Number(conv.toFixed(4)),
    };
  });
}

/**
 * Normalizes GA4 report rows into standard NormalizedMetric objects.
 */
export function normalizeGA4Data(
  rawData: GA4ReportRow[],
  clientId: string,
  integrationId: string
): NormalizedMetric[] {
  return rawData.map((row) => ({
    client_id: clientId,
    integration_id: integrationId,
    date: row.dimensionValues?.[1]?.value || new Date().toISOString().split("T")[0],
    campaign_name: row.dimensionValues?.[0]?.value || "GA4 Traffic Source",
    spend: Number(parseFloat(row.metricValues?.[0]?.value || "0").toFixed(4)),
    impressions: parseInt(row.metricValues?.[1]?.value || "0", 10),
    clicks: parseInt(row.metricValues?.[2]?.value || "0", 10),
    conversions: Number(parseFloat(row.metricValues?.[3]?.value || "0").toFixed(4)),
  }));
}
