# Reportly — Automated Client Performance Reporting for Marketing Agencies

**Reportly** is a modern multi-tenant SaaS platform engineered specifically for marketing agencies to automatically aggregate performance data across marketing platforms, compute KPIs, generate strategic insights, and produce client-ready performance reports.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Design System**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI Primitives](https://www.radix-ui.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) & PostgreSQL
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
│       └── 20260907000000_initial_schema.sql  # Database schema & RLS policies
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login & Signup auth pages
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/          # Authenticated Agency Shell
│   │   │   ├── layout.tsx      # Persistent Sidebar + Header layout
│   │   │   ├── page.tsx        # Overview KPI Dashboard
│   │   │   ├── clients/        # Client Management UI
│   │   │   ├── reports/        # Report Management UI
│   │   │   ├── integrations/   # Channel Integration UI
│   │   │   └── settings/       # Agency Settings UI
│   │   ├── globals.css         # Design system CSS variables & Tailwind v4
│   │   ├── layout.tsx          # Root HTML layout
│   │   ├── not-found.tsx       # 404 Error page
│   │   └── error.tsx           # Global error boundary
│   ├── components/
│   │   ├── ui/                 # Reusable UI primitives (Button, Card, Badge, Dialog, etc.)
│   │   └── dashboard/          # Dashboard components (Sidebar, Header, KPICards, etc.)
│   ├── lib/
│   │   ├── supabase/           # Isolated Supabase client factories
│   │   │   ├── client.ts       # Browser client (createBrowserClient)
│   │   │   ├── server.ts       # Server client (createServerClient)
│   │   │   └── middleware.ts   # Session update helper
│   │   ├── utils/              # Utility helpers (cn)
│   │   └── validations/        # Zod input schemas (Agency, Client, Report)
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

Fill in your Supabase project credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Security Note**: Never commit `.env.local` or expose service role keys to client code.

---

## Supabase & Database Setup

### 1. Apply Schema Migrations
Execute the SQL migration script located in [`supabase/migrations/20260907000000_initial_schema.sql`](file:///c:/Users/Hp/Desktop/Reportly/supabase/migrations/20260907000000_initial_schema.sql) in your Supabase SQL Editor or via Supabase CLI:

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

---

## Architecture Rules & Security Summary

1. **Client/Server Isolation**: Separate Supabase clients (`lib/supabase/client.ts` vs `lib/supabase/server.ts`) guarantee no service-role secrets leak to client components.
2. **Server Enforcement**: Authorization checks occur at database & server level via RLS and Zod validation.
3. **Extensibility**: Third-party OAuth integration surfaces are decoupled and ready for credential encryption at rest in Phase 2.
