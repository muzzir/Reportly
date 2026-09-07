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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          primary_color?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
          created_at?: string;
          updated_at?: string;
        };
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
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
