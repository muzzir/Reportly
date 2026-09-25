# Reportly — Production Environment & Supabase Deployment Checklist

This document provides a comprehensive operational checklist for deploying **Reportly** to production (Vercel + Supabase). Every environment variable, database configuration, security policy, and operational recommendation is detailed below.

---

## 1. Vercel Environment Variables Matrix

Set the following environment variables in **Vercel Project Settings → Environment Variables**. Ensure variables are enabled for both **Production** and **Preview** environments as specified.

### 🔹 Supabase Infrastructure
| Variable Name | Environment | Required | Description / Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | **Yes** | Live Supabase project URL (`https://<project-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production & Preview | **Yes** | Client-safe anonymous key used with RLS (`eyJhbG...`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Only | **Yes** | **Server-only secret key**. Never expose to browser. Bypasses RLS for system sync jobs. |

### 🔹 Application Domain
| Variable Name | Environment | Required | Description / Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Production & Preview | **Yes** | Canonical app URL (`https://app.reportly.com`). Used for OAuth callbacks, emails, & Stripe redirects. |

### 🔹 Third-Party OAuth Integrations
| Variable Name | Environment | Required | Description / Example |
| :--- | :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | Production & Preview | **Yes** | Google Cloud OAuth 2.0 Client ID for Google Ads & GA4. |
| `GOOGLE_CLIENT_SECRET` | Production Only | **Yes** | Google Cloud OAuth 2.0 Client Secret. |
| `META_CLIENT_ID` | Production & Preview | **Yes** | Meta for Developers App ID for Facebook & Instagram Ads. |
| `META_CLIENT_SECRET` | Production Only | **Yes** | Meta for Developers App Secret. |
| `MOCK_OAUTH` | Production | **No (Set `false`)** | Must be omitted or explicitly set to `false` in production. |
| `MOCK_EXTERNAL_APIS` | Production | **No (Set `false`)** | Must be omitted or explicitly set to `false` in production. |

### 🔹 Data Security & Cron Auth
| Variable Name | Environment | Required | Description / Example |
| :--- | :--- | :--- | :--- |
| `ENCRYPTION_KEY` | Production Only | **Yes** | 32-byte secret key (64-hex chars or 44-base64 chars) for AES-256-GCM OAuth token encryption at rest. |
| `CRON_SECRET` | Production Only | **Yes** | Cryptographic token required in `Authorization: Bearer <CRON_SECRET>` header for Vercel Cron jobs. |
| `SUPER_ADMIN_EMAILS` | Production Only | **Yes** | Comma-separated list of authorized super admin email addresses (e.g., `admin@reportly.com`). |

### 🔹 Stripe Billing & Subscriptions
| Variable Name | Environment | Required | Description / Example |
| :--- | :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | Production Only | **Yes** | Live Stripe API secret key (`sk_live_...`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production & Preview | **Yes** | Live Stripe publishable key (`pk_live_...`). |
| `STRIPE_WEBHOOK_SECRET` | Production Only | **Yes** | Live Stripe endpoint secret for webhook verification (`whsec_...`). |
| `STRIPE_PRO_PRICE_ID` | Production Only | **Yes** | Stripe recurring Price ID for the Pro subscription plan (`price_...`). |

### 🔹 Email Dispatch & Error Monitoring
| Variable Name | Environment | Required | Description / Example |
| :--- | :--- | :--- | :--- |
| `RESEND_API_KEY` | Production Only | **Yes** | Resend API key (`re_...`) for dispatching automated client report emails. |
| `NEXT_PUBLIC_SENTRY_DSN` | Production & Preview | Optional | Sentry DSN for frontend and backend runtime error tracking. |

---

## 2. Supabase Production Readiness Checklist

### ✅ Database Row Level Security (RLS) Audit
Verify that **Row Level Security** is enabled and active on all production database tables:
- [x] `agencies` — RLS enabled (Agency members read/update their own agency profile).
- [x] `agency_users` — RLS enabled (Agency admins write; agency members read workspace users).
- [x] `clients` — RLS enabled (Agency members access assigned agency clients; public token read for public sharing).
- [x] `integrations` — RLS enabled (Encrypted tokens access restricted to authorized agency members).
- [x] `marketing_metrics` — RLS enabled (Agency members read/write performance metrics).
- [x] `platform_logs` — RLS enabled (Super admin & service role write access).

### ✅ Storage Bucket RLS Verification (`agency_assets`)
Verify the `agency_assets` storage bucket configuration:
1. Bucket Visibility: **Public** (Allows direct HTTP asset resolution for logos and white-labeled headers).
2. Allowed MIME Types: `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`.
3. File Size Limit: `5MB`.
4. RLS Storage Policies:
   - `SELECT`: Public access allowed to read agency logo assets.
   - `INSERT / UPDATE / DELETE`: Restricted to authenticated members of the respective agency (`(storage.foldername(name))[1] = agency_id`).

### ✅ Essential Database Performance Indexes
Ensure foreign key and high-frequency search query indexes are created in Supabase:

```sql
-- Client & Integration Queries
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_public_token ON clients(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_integrations_agency_id ON integrations(agency_id);
CREATE INDEX IF NOT EXISTS idx_integrations_client_id ON integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);

-- Marketing Metrics Query Performance
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_client_id ON marketing_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_date ON marketing_metrics(date);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_client_date ON marketing_metrics(client_id, date);

-- Agency Membership & Security
CREATE INDEX IF NOT EXISTS idx_agency_users_user_id ON agency_users(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_agency_id ON agency_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_platform_logs_created_at ON platform_logs(created_at DESC);
```

### ✅ Backup & Point-in-Time Recovery (PITR) Strategy
1. **Enable Point-in-Time Recovery (PITR)** in Supabase Dashboard → Database → Backups.
2. PITR provides continuous log backups allowing recovery to any exact second within a 7-day or 14-day window.
3. Configure automated daily snapshot backups.

### ✅ Database Connection Pooling & Limits
1. Use the **Transaction Mode (port 6543)** Supabase Connection Pooler URL for serverless Vercel function instances.
2. Ensure connection pool size is tuned to handle serverless spikes without exceeding PostgreSQL connection limits.

---

## 3. Pre-Deployment Verification Protocol

Before going live:
1. Run `npm run lint` — Confirm 0 errors and 0 warnings.
2. Run `npm run build` — Confirm clean compilation and evaluate bundle sizes.
3. Verify Vercel Cron schedule (`/api/cron/monthly-reports` set for `0 9 1 * *`).
4. Test Stripe live webhook endpoint (`/api/webhooks/stripe`) with test signature verification.
5. Verify domain SSL certificates and HTTPS forcing on Vercel.
