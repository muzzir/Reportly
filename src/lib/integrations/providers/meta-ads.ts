export interface MetaAdsInsightRow {
  campaign_name: string;
  campaign_id: string;
  date_start: string; // YYYY-MM-DD
  spend: string; // String float e.g. "192.40"
  impressions: string; // String int e.g. "18400"
  clicks: string; // String int e.g. "520"
  conversions?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

/**
 * Fetches campaign performance insights from Meta Ads Graph API.
 * Uses mock fallback if MOCK_EXTERNAL_APIS environment variable is set.
 */
export async function fetchMetaAdsMetrics(
  accessToken: string,
  externalAccountId: string,
  startDate: string,
  endDate: string
): Promise<MetaAdsInsightRow[]> {
  if (process.env.MOCK_EXTERNAL_APIS !== "false") {
    // Return typed mock Meta Ads insights payload
    return [
      {
        campaign_id: "m_cmp_201",
        campaign_name: "Meta Prospecting - Advantage+ Feed",
        date_start: endDate,
        spend: "192.40",
        impressions: "18400",
        clicks: "520",
        conversions: "24",
      },
      {
        campaign_id: "m_cmp_202",
        campaign_name: "Meta Instagram Stories - Summer Promo",
        date_start: endDate,
        spend: "135.00",
        impressions: "24100",
        clicks: "680",
        conversions: "18",
      },
      {
        campaign_id: "m_cmp_203",
        campaign_name: "Meta Retargeting - Add to Cart Abandoners",
        date_start: endDate,
        spend: "88.75",
        impressions: "8900",
        clicks: "340",
        conversions: "31",
      },
    ];
  }

  // Live Meta Graph API Insights call
  const actId = externalAccountId.startsWith("act_") ? externalAccountId : `act_${externalAccountId}`;
  const fields = "campaign_name,campaign_id,date_start,spend,impressions,clicks,actions";
  const url = `https://graph.facebook.com/v19.0/${actId}/insights?fields=${fields}&time_range={'since':'${startDate}','until':'${endDate}'}&level=campaign&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errText = await response.text();
    console.error(`Meta Ads API error (${response.status}):`, errText);
    throw new Error(`Meta Ads API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}
