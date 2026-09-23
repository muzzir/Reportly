export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          primary_color: string | null;
          website: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan_tier: string;
          plan_status: string;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          primary_color?: string | null;
          website?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: string;
          plan_status?: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          website?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_tier?: string;
          plan_status?: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agency_members: {
        Row: {
          id: string;
          agency_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      agency_users: {
        Row: {
          id: string;
          agency_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agency_users_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      clients: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          logo_url: string | null;
          website: string | null;
          industry: string | null;
          timezone: string;
          currency: string;
          auto_report_enabled: boolean;
          auto_report_emails: string[] | null;
          last_report_sent_at: string | null;
          public_token: string;
          is_public_sharing_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          name: string;
          logo_url?: string | null;
          website?: string | null;
          industry?: string | null;
          timezone?: string;
          currency?: string;
          auto_report_enabled?: boolean;
          auto_report_emails?: string[] | null;
          last_report_sent_at?: string | null;
          public_token?: string;
          is_public_sharing_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          name?: string;
          logo_url?: string | null;
          website?: string | null;
          industry?: string | null;
          timezone?: string;
          currency?: string;
          auto_report_enabled?: boolean;
          auto_report_emails?: string[] | null;
          last_report_sent_at?: string | null;
          public_token?: string;
          is_public_sharing_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      integrations: {
        Row: {
          id: string;
          agency_id: string;
          client_id: string | null;
          provider: "google_ads" | "meta_ads" | "ga4";
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          external_account_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          client_id?: string | null;
          provider: "google_ads" | "meta_ads" | "ga4";
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          external_account_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          client_id?: string | null;
          provider?: "google_ads" | "meta_ads" | "ga4";
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          external_account_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integrations_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integrations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      marketing_metrics: {
        Row: {
          id: string;
          client_id: string;
          integration_id: string;
          date: string;
          campaign_name: string;
          spend: number;
          impressions: number;
          clicks: number;
          conversions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          integration_id: string;
          date: string;
          campaign_name: string;
          spend?: number;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          integration_id?: string;
          date?: string;
          campaign_name?: string;
          spend?: number;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_metrics_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_metrics_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integrations";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          agency_id: string;
          client_id: string;
          period_start: string;
          period_end: string;
          status: "draft" | "generating" | "published" | "archived";
          title: string;
          generated_at: string | null;
          metrics_summary: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          client_id: string;
          period_start: string;
          period_end: string;
          status?: "draft" | "generating" | "published" | "archived";
          title: string;
          generated_at?: string | null;
          metrics_summary?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          client_id?: string;
          period_start?: string;
          period_end?: string;
          status?: "draft" | "generating" | "published" | "archived";
          title?: string;
          generated_at?: string | null;
          metrics_summary?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_agency_id: {
        Args: { user_uuid: string };
        Returns: string;
      };
      get_user_role: {
        Args: { user_uuid: string; agency_uuid: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
