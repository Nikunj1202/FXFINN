# FXFINN — Personal Wealth & Net Worth Management

FXFINN is a responsive personal-finance web application starter built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth and PostgreSQL. It focuses on the personal wealth workflow: income and expenses → transactions → assets and liabilities → net worth → allocation and goals → reporting.

This repository is a **functional V1 foundation**, not a claim that every item in the full product brief is already production-complete. See **V1 scope and known gaps** below before deploying it for real financial data.

## Stack

- Next.js 15.5 (maintenance LTS) App Router + React 19 + TypeScript
- Tailwind CSS 4 and Lucide icons
- Supabase Auth (`@supabase/ssr` 0.12+) PostgreSQL, Row Level Security and private Storage
- Zod validation at API boundaries
- Recharts for visualizations
- `xlsx`, `jspdf` and `jspdf-autotable` for exports
- Vitest for financial calculation tests

## Run locally

Requirements: Node.js 22+, npm, and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project. In **Project Settings → API Keys**, copy the Project URL and publishable key. The legacy anon key is also accepted. Do not put the `service_role` or secret key in this application.

3. Create `.env.local` from `.env.example`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Apply the schema in `supabase/migrations/0001_initial_schema.sql` using the Supabase SQL Editor, or install the Supabase CLI and run the migration using your normal migration workflow. The migration creates the user-owned tables, RLS policies, signup profile trigger, allocation RPC and a private Storage bucket.

5. In Supabase **Authentication → URL Configuration**, add `http://localhost:3000` as a site URL and `http://localhost:3000/auth/callback` as an allowed redirect URL (or the `/auth/callback` wildcard for local development). Configure SMTP and email verification before public use.

6. Run the application:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` and create an account. If email confirmation is enabled, verify the address before signing in.

## Main screens

- **Dashboard** — net worth, assets, liabilities, month/year income and expenses, savings rate, daily snapshots, asset and spending mix, latest transactions, goals and an internal wealth score.
- **Transactions** — unified ledger for income, expenses, transfers, investments, debt payments, asset purchases and sales; supports type/date/search filters.
- **Assets** — add assets and manually revise current valuations; ROI and gain/loss are calculated.
- **Liabilities** — add debt, track original/outstanding balances, interest rate and monthly payment; outstanding debt is editable.
- **Allocation** — configurable percentage buckets; save is rejected unless the total equals exactly 100%; amount preview is calculated from a monthly income input.
- **Goals** — define target values and update progress.
- **Reports** — export a PDF summary, Excel workbook, transaction CSV or full JSON data backup.
- **Settings** — profile, base currency, theme preference, time zone, accounts and backup access.

## Financial model decisions

- PostgreSQL stores monetary values as `NUMERIC(20,2)` (quantity uses a higher decimal scale). The application calculation helpers convert values to integer minor units (`BigInt`) for money arithmetic.
- A transaction is the common ledger record. Transfers can link a source and destination account, but ledger entries do not automatically mutate account balances or asset/liability records in this V1; reconcile those balances explicitly after settlement or valuation changes.
- Account balances are included in total assets, except credit-card accounts. Record credit-card debt under **Liabilities**. Do not enter the same cash or bank balance both as an account balance and as an asset; it would be double-counted.
- Each record stores a currency. Dashboard aggregation includes records matching the profile's selected base currency. FX conversion is not implemented yet. Changing the base currency does **not** convert historical records; change it only after reconciling your entries.
- Daily net-worth snapshots are created/upserted when the dashboard is opened. This is activity-driven and not a background scheduler. Monthly/yearly series can be derived from those daily snapshots once sufficient history exists.
- The wealth score is an internal heuristic. It is not a credit score, a regulated financial health assessment or financial advice.

## Security model

- Supabase Auth manages password hashing and session tokens; the app does not store passwords.
- The middleware refreshes Supabase session cookies. Protected app layouts and every API route verify the authenticated user.
- Every user-owned table has RLS enabled with ownership checks against `auth.uid()`. The app uses the anon key with the authenticated user's session; no service-role secret is needed at runtime.
- Transaction account references are checked server-side by a database trigger to prevent attaching another user's account.
- The file bucket is private. Storage policies restrict paths to the authenticated user's UUID folder.
- User-controlled inputs are validated with Zod and database constraints. Financial API responses are marked `no-store` on backup export.
- Audit events are recorded for core create/update/delete operations and export actions without copying financial payloads into logs.
- The service worker never caches `/api/*` endpoints or authenticated navigation HTML. It only retains the offline shell and public static resources.

## Tests

```bash
npm test
npm run typecheck
npm run build
```

The test suite covers integer-minor-unit addition, net-worth calculation, savings rate, ROI, goal progress and allocation amounts. Add database integration and Playwright end-to-end tests before production deployment.

## Environment and deployment

Deploy to Vercel or another Node.js hosting provider. Set the same Supabase environment variables in the hosting platform, configure the production callback URLs in Supabase Auth, enforce HTTPS, and test email verification and password recovery end-to-end. The manifest and service worker enable an installable PWA experience on supported platforms.

Do not use a local SQLite/JSON file as the production database. PostgreSQL is the system of record.

## V1 scope and known gaps

The following requirements from the larger brief have foundations or placeholders but are **not complete** in this V1:

1. **Backups / recovery:** the app provides a user-initiated JSON export. Configure Supabase automated backups, retention and point-in-time recovery according to the selected plan; test restoration. No custom scheduled backup worker or self-service restore exists.
2. **Financial automation:** investment and debt ledger entries do not reconcile automatically to holdings or loan balances. Account balances and valuations are user-maintained. No broker/bank sync or FX rate service is included.
3. **Allocation reconciliation:** the percentage plan is stored and validated, but it does not move cash, create transfers, retain a full version history or reconcile every plan bucket against actual spending automatically.
4. **Historical analytics:** daily snapshots are activity-driven by dashboard visits; there is no scheduled daily/monthly cron job. Historical growth is only meaningful after enough snapshots have accumulated.
5. **Gamification:** wealth tier defaults and schema exist; a full tier editor, automatic achievement-unlock evaluator and achievement notification workflow remain to be implemented.
6. **Wealth score:** the score is a V1 heuristic. A few components are proxies and should be tuned or shown as unavailable when records are incomplete; it is not investment or credit advice.
7. **Reports:** exports work on demand. Scheduled monthly/quarterly/yearly reports, historical report archives and richer comparative reporting are not implemented.
8. **SaaS administration:** subscriptions, billing, plans, tenant administration, feature flags and service analytics are schema/architecture concerns for a later SaaS phase; no fake paywall is included.
9. **Privacy and account lifecycle:** Privacy and Terms pages are drafts and must be reviewed by counsel and completed with the operating entity's details. Self-service account deletion and verified erasure are not implemented.
10. **Production hardening:** add application-level rate limiting, a reviewed Content Security Policy, security headers, automated dependency scanning, database/API integration tests, Playwright flows, alerting and tested disaster recovery. Configure Supabase Auth email templates, SMTP, session policies and MFA as appropriate.
11. **Design preferences:** theme preference is stored; the dark theme visual token set and a full system-theme switch are not implemented yet. Accessibility and browser/device QA should be completed before launch.

## Project map

```text
fxfinn/
├── middleware.ts
├── public/                 # PWA manifest, icon, offline shell, service worker
├── src/
│   ├── app/
│   │   ├── (app)/           # Authenticated product screens
│   │   ├── api/             # Authenticated REST endpoints
│   │   ├── login/ register/ forgot-password/ reset-password/
│   │   └── privacy/ terms/
│   ├── components/          # Responsive UI and screen workflows
│   └── lib/                 # Supabase clients, validation, finance engine
├── supabase/migrations/     # PostgreSQL schema, RLS, triggers, storage policies
└── tests/                   # Financial calculation unit tests
```

## Legal note

FXFINN is a record-keeping and calculation tool. The app does not provide regulated investment, tax, accounting, lending or legal services. Validate all records and obtain independent professional advice for decisions requiring it.
