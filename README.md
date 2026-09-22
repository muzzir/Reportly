# Reportly — Automated Client Performance Reporting for Marketing Agencies

**Reportly** is a modern multi-tenant SaaS platform engineered specifically for marketing agencies to automatically aggregate performance data across marketing platforms, compute KPIs, generate strategic insights, and produce client-ready performance reports.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Design System**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI Primitives](https://www.radix-ui.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) & PostgreSQL
- **Security & Encryption**: Node.js `crypto` AES-256-GCM token encryption at rest
- **Multi-Tenant Security**: PostgreSQL Row Level Security (RLS) policies
- **Validation**: [Zod](https://zod.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Project Structure

```
Reportly/
├── .env.example                # Template for environment configuration
├── supabase/
│   └── migrations/
│       ├── 20260907000000_initial_schema.sql      # Database schema & RLS policies
│       └── 20260907100000_phase2_enhancements.sql # Schema updates & RLS policies
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login & Signup auth pages
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── api/
│   │   │   └── integrations/   # OAuth Route Handlers
│   │   │       └── [provider]/
│   │   │           ├── authorize/route.ts  # CSRF State & OAuth Initiate
│   │   │           └── callback/route.ts   # Code Exchange & AES-256 Encryption
│   │   ├── dashboard/          # Authenticated Agency Shell
│   │   │   ├── layout.tsx      # Persistent Sidebar + Header layout
│   │   │   ├── page.tsx        # Overview KPI Dashboard
│   │   │   ├── clients/        # Client Management UI
│   │   │   │   └── [clientId]/integrations/  # Client Integrations Dashboard UI
│   │   │   ├── reports/        # Report Management UI
│   │   │   ├── integrations/   # Global Channel Integrations UI
│   │   │   └── settings/       # Agency Settings UI
│   │   ├── globals.css         # Design system CSS variables & Tailwind v4
│   │   ├── layout.tsx          # Root HTML layout
│   │   ├── not-found.tsx       # 404 Error page
│   │   └── error.tsx           # Global error boundary
│   ├── components/
│   │   ├── ui/                 # Reusable UI primitives (Button, Card, Badge, Dialog, Toast)
│   │   ├── clients/            # Client management dialogs
│   │   └── dashboard/          # Dashboard layout components (Sidebar, Header, KPICards)
│   ├── lib/
│   │   ├── oauth/              # OAuth provider configs & HMAC state signing
│   │   │   └── config.ts
│   │   ├── security/           # Application-level token encryption
│   │   │   ├── encryption.ts   # AES-256-GCM encrypt & decrypt utilities
│   │   │   └── crypto.ts       # Utility exports
│   │   ├── supabase/           # Isolated Supabase client factories
│   │   │   ├── client.ts       # Browser client (createBrowserClient)
│   │   │   ├── server.ts       # Server client (createServerClient)
│   │   │   └── middleware.ts   # Session update helper
│   │   ├── utils/              # Utility helpers (cn)
│   │   └── validations/        # Zod input schemas (Agency, Client, Report, OAuth)
│   ├── types/                  # TypeScript domain & database type definitions
│   └── middleware.ts           # Root Next.js session middleware
```

---

## Local Development Setup

### 1. Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- A Supabase Project (or local Supabase CLI instance)

### 2. Installation
Clone the repository and install dependencies:

```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your configuration in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
MOCK_OAUTH=true
```

> **Security Note**: Never commit `.env.local` or expose `ENCRYPTION_KEY` / service role keys to client-side code.

---

## OAuth 2.0 & Credential Management Architecture (Phase 3)

### 1. Developer Mock Mode (`MOCK_OAUTH=true`)
To enable testing without waiting for live Google or Meta API app approvals:
- Setting `MOCK_OAUTH=true` in `.env.local` simulates a successful OAuth authorization code flow.
- The `/authorize` endpoint generates state tokens and redirects directly to `/callback`.
- The `/callback` handler generates mock access & refresh tokens, encrypts them using **AES-256-GCM**, and saves credentials to Supabase.

### 2. Token Security & Encryption at Rest
- Raw OAuth `access_token` and `refresh_token` strings are **never** stored in plain text.
- Tokens are encrypted server-side using `AES-256-GCM` before database insertion via [`src/lib/security/encryption.ts`](file:///c:/Users/Hp/Desktop/Reportly/src/lib/security/encryption.ts).
- Server actions sanitize token fields (`"[ENCRYPTED]"`) before returning data to client components. Raw tokens are never sent to the browser.

### 3. CSRF Protection
- Authorize requests generate cryptographically signed HMAC state parameters (`csrfToken`, `clientId`, `provider`, `timestamp`).
- State signature is validated during callback to prevent CSRF attacks.

---

## Supabase & Database Setup

### 1. Apply Schema Migrations
Execute SQL migration scripts located in `supabase/migrations/` in your Supabase SQL Editor:

```bash
npx supabase db push
```

### 2. Multi-Tenant RLS Architecture
Multi-tenancy is enforced at the database level using Row Level Security policies:
- The `agency_members` table connects Supabase `auth.users` to `agencies`.
- The PostgreSQL helper function `public.get_user_agency_id(auth.uid())` resolves the active user's agency.
- RLS policies ensure users can **only** view and mutate `clients`, `integrations`, and `reports` belonging to their own agency.

---

## Scripts & Verification

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server at `http://localhost:3000` |
| `npm run lint` | Runs ESLint check for code style and potential errors |
| `npm run build` | Builds production output bundle and checks TypeScript types |
| `npm run start` | Starts production server |
