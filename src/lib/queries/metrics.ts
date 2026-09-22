import { createClient } from "@/lib/supabase/server";

export interface AggregateKPIs {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  cpc: number;
  ctr: number;
  cpa: number;
}

export interface TimeSeriesMetricPoint {
  date: string;
  spend: number;
  clicks: number;
  conversions: number;
  impressions: number;
}

export interface CampaignMetricRow {
  campaign_name: string;
  provider: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  cpc: number;
  ctr: number;
}

export interface ClientMetricsData {
  kpis: AggregateKPIs;
  timeSeries: TimeSeriesMetricPoint[];
  campaigns: CampaignMetricRow[];
  hasData: boolean;
  startDate: string;
  endDate: string;
}

export async function getClientMetrics(
  clientId: string,
  startDateStr?: string,
  endDateStr?: string
): Promise<ClientMetricsData> {
  const supabase = await createClient();

  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const startStr = startDateStr || thirtyDaysAgoStr;
  const endStr = endDateStr || todayStr;

  // Query database for marketing metrics within date range
  const { data: rawRows, error } = await supabase
    .from("marketing_metrics")
    .select(`
      id,
      client_id,
      integration_id,
      date,
      campaign_name,
      spend,
      impressions,
      clicks,
      conversions,
      integrations (
        provider
      )
    `)
    .eq("client_id", clientId)
    .gte("date", startStr)
    .lte("date", endStr)
    .order("date", { ascending: true });

  if (error || !rawRows || rawRows.length === 0) {
    return {
      kpis: {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        cpc: 0,
        ctr: 0,
        cpa: 0,
      },
      timeSeries: [],
      campaigns: [],
      hasData: false,
      startDate: startStr,
      endDate: endStr,
    };
  }

  // 1. Calculate Aggregate Totals
  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;

  // Map for daily time series grouping
  const timeSeriesMap = new Map<string, TimeSeriesMetricPoint>();

  // Map for campaign aggregation
  const campaignMap = new Map<string, {
    campaign_name: string;
    provider: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>();

  for (const row of rawRows) {
    const spend = Number(row.spend || 0);
    const impressions = Number(row.impressions || 0);
    const clicks = Number(row.clicks || 0);
    const conversions = Number(row.conversions || 0);

    totalSpend += spend;
    totalImpressions += impressions;
    totalClicks += clicks;
    totalConversions += conversions;

    // Daily grouping
    const dateKey = row.date;
    const existingDay = timeSeriesMap.get(dateKey) || {
      date: dateKey,
      spend: 0,
      clicks: 0,
      conversions: 0,
      impressions: 0,
    };
    existingDay.spend += spend;
    existingDay.clicks += clicks;
    existingDay.conversions += conversions;
    existingDay.impressions += impressions;
    timeSeriesMap.set(dateKey, existingDay);

    // Campaign grouping
    const rawIntegration = row.integrations as unknown as { provider: string } | null;
    const provider = rawIntegration?.provider || "unknown";
    const campaignKey = `${row.campaign_name}_${provider}`;

    const existingCampaign = campaignMap.get(campaignKey) || {
      campaign_name: row.campaign_name,
      provider,
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };

    existingCampaign.spend += spend;
    existingCampaign.impressions += impressions;
    existingCampaign.clicks += clicks;
    existingCampaign.conversions += conversions;
    campaignMap.set(campaignKey, existingCampaign);
  }

  // Calculate derived aggregate KPIs
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

  // Format Time Series array (sorted by date)
  const timeSeries = Array.from(timeSeriesMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format Campaigns array with derived CPC, CTR, CPA per campaign
  const campaigns: CampaignMetricRow[] = Array.from(campaignMap.values())
    .map((c) => {
      const campCpc = c.clicks > 0 ? c.spend / c.clicks : 0;
      const campCtr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
      const campCpa = c.conversions > 0 ? c.spend / c.conversions : 0;

      return {
        campaign_name: c.campaign_name,
        provider: c.provider,
        spend: Number(c.spend.toFixed(2)),
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: Number(c.conversions.toFixed(2)),
        cpc: Number(campCpc.toFixed(2)),
        ctr: Number(campCtr.toFixed(2)),
        cpa: Number(campCpa.toFixed(2)),
      };
    })
    .sort((a, b) => b.spend - a.spend);

  return {
    kpis: {
      totalSpend: Number(totalSpend.toFixed(2)),
      totalImpressions,
      totalClicks,
      totalConversions: Number(totalConversions.toFixed(2)),
      cpc: Number(cpc.toFixed(2)),
      ctr: Number(ctr.toFixed(2)),
      cpa: Number(cpa.toFixed(2)),
    },
    timeSeries,
    campaigns,
    hasData: true,
    startDate: startStr,
    endDate: endStr,
  };
}
