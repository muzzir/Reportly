export interface GoogleAdsMetricsRow {
  campaign: {
    id: string;
    name: string;
  };
  segments: {
    date: string; // YYYY-MM-DD
  };
  metrics: {
    cost_micros: number; // Spend in micros ($1.00 = 1,000,000 micros)
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

/**
 * Fetches campaign performance metrics from Google Ads API.
 * Uses mock fallback if MOCK_EXTERNAL_APIS environment variable is set.
 */
export async function fetchGoogleAdsMetrics(
  accessToken: string,
  externalAccountId: string,
  startDate: string,
  endDate: string
): Promise<GoogleAdsMetricsRow[]> {
  if (process.env.MOCK_EXTERNAL_APIS !== "false") {
    // Return typed mock Google Ads metrics payload
    return [
      {
        campaign: { id: "g_cmp_101", name: "Google Search - High Intent Brand" },
        segments: { date: endDate },
        metrics: { cost_micros: 145800000, impressions: 12450, clicks: 890, conversions: 42.5 },
      },
      {
        campaign: { id: "g_cmp_102", name: "Google Display - Retargeting Q3" },
        segments: { date: endDate },
        metrics: { cost_micros: 78500000, impressions: 45200, clicks: 310, conversions: 12.0 },
      },
      {
        campaign: { id: "g_cmp_103", name: "Google Performance Max - Ecomm" },
        segments: { date: endDate },
        metrics: { cost_micros: 210000000, impressions: 28900, clicks: 1420, conversions: 68.0 },
      },
    ];
  }

  // Live Google Ads API call (GAQL Search Stream)
  const customerId = externalAccountId.replace(/-/g, "");
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
  `;

  const response = await fetch(`https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN || "mock_dev_token",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Google Ads API error (${response.status}):`, errText);
    throw new Error(`Google Ads API error: ${response.statusText}`);
  }

  const data = await response.json();
  const results: GoogleAdsMetricsRow[] = [];
  if (Array.isArray(data)) {
    for (const batch of data) {
      if (batch.results) {
        results.push(...batch.results);
      }
    }
  }
  return results;
}
