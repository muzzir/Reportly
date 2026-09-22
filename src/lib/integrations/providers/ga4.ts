export interface GA4ReportRow {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

/**
 * Fetches analytics report metrics from GA4 Data API.
 * Uses mock fallback if MOCK_EXTERNAL_APIS environment variable is set.
 */
export async function fetchGA4Metrics(
  accessToken: string,
  externalAccountId: string,
  startDate: string,
  endDate: string
): Promise<GA4ReportRow[]> {
  if (process.env.MOCK_EXTERNAL_APIS !== "false") {
    // Return typed mock GA4 report metrics payload
    return [
      {
        dimensionValues: [{ value: "GA4 Organic Search & Direct Traffic" }, { value: endDate }],
        metricValues: [{ value: "0.00" }, { value: "32400" }, { value: "4800" }, { value: "115" }],
      },
      {
        dimensionValues: [{ value: "GA4 Referral & Social Channel" }, { value: endDate }],
        metricValues: [{ value: "0.00" }, { value: "14200" }, { value: "1950" }, { value: "48" }],
      },
    ];
  }

  // Live GA4 Analytics Data API runReport call
  const propertyId = externalAccountId.replace("properties/", "");
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }, { name: "date" }],
      metrics: [
        { name: "eventValue" },
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "conversions" },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`GA4 Data API error (${response.status}):`, errText);
    throw new Error(`GA4 Data API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.rows || [];
}
