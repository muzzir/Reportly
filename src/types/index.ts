import { Database } from "./database";

export type Agency = Database["public"]["Tables"]["agencies"]["Row"];
export type AgencyInsert = Database["public"]["Tables"]["agencies"]["Insert"];
export type AgencyUpdate = Database["public"]["Tables"]["agencies"]["Update"];

export type AgencyMember = Database["public"]["Tables"]["agency_members"]["Row"];

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export type Integration = Database["public"]["Tables"]["integrations"]["Row"];
export type IntegrationInsert = Database["public"]["Tables"]["integrations"]["Insert"];

export type MarketingMetric = Database["public"]["Tables"]["marketing_metrics"]["Row"];
export type MarketingMetricInsert = Database["public"]["Tables"]["marketing_metrics"]["Insert"];
export type MarketingMetricUpdate = Database["public"]["Tables"]["marketing_metrics"]["Update"];

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
export type ReportUpdate = Database["public"]["Tables"]["reports"]["Update"];

export type IntegrationProvider = "google_ads" | "meta_ads" | "ga4";
export type ReportStatus = "draft" | "generating" | "published" | "archived";
export type UserRole = "owner" | "admin" | "member";

export interface ChannelMetric {
  spend: number;
  conversions: number;
  sessions?: number;
}

export interface ReportMetricsSummary {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  roas: number;
  channels: {
    google_ads?: ChannelMetric;
    meta_ads?: ChannelMetric;
    ga4?: ChannelMetric;
  };
}

export interface DashboardKPISummary {
  totalClients: number;
  totalReports: number;
  connectedPlatforms: number;
  reportsThisMonth: number;
}
