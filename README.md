# shipd2r Command Center

This is the first executable MVP slice for the build brief:

> Central ERP/CRM is the source of truth. Sales team uses the sales app. Retailers use WhatsApp. Brand partners see verified dashboards.

The current implementation is a deployed Next.js command-center MVP backed by Supabase.

## What Is Built

- Retailer WhatsApp intake and Meta webhook route
- Sales-app oriented workflow model for visits, orders, payments, tasks, and evidence capture
- AI extraction provider settings for Sarvam AI, OpenAI, and Gemini
- Human-in-the-loop verification queue
- Internal command center metrics
- MVP role login for admins, managers, sales executives, and brand partners
- Admin user management from the `Users` workspace
- Separate sales-executive app shell after sales login
- Partner dashboard that only shows verified records
- Supabase-backed CRUD for outlets, salesmen, clients/brands, territories, tasks, payments, orders, and bills
- Next.js App Router scaffold under `src/app`
- Typed command-center client component under `src/features/command-center`

Production app:

```txt
https://distribution-intel.vercel.app
```

The current app supports adding:

- Sales rep / app user from `Sales App & Team`
- Outlet from `Outlets`
- Client / brand from `Partners`

These records are written to Supabase through server actions.

## MVP Login Model

The current login is an MVP access layer, not final Supabase Auth yet.

- Admins can access the full ERP / CRM, including `Users`.
- Managers can access operating screens but not integration or user administration.
- Sales executives get a separate sales app workspace.
- Brand partners are limited to partner dashboards and reports.

For now, users log in with role + email/phone/name + the last 4 digits of their phone. If no admin user exists yet, use role `Admin` with any identifier and access code `0000`, then create a real admin from `Users`.

## Running the Next.js App

Install dependencies, then start the app:

```txt
npm install
npm run dev
```

The Next.js app is configured for:

```txt
http://localhost:3000
```

Note: dependency installation was attempted during setup, but the machine ran out of disk space while unpacking `node_modules`. The failed install artifacts were removed.

## Cloud Deployment

This project is ready to push to:

```txt
https://github.com/czr41/Distribution-Intel
```

See `CLOUD_DEPLOY.md` for Supabase, Vercel, and environment variable setup.

## Recommended Production Stack

- Frontend: Next.js, TypeScript, Tailwind or CSS modules
- Backend: NestJS or FastAPI
- Database: Postgres with Prisma or SQLAlchemy
- Queue: BullMQ, Temporal, or Cloud Tasks
- Storage: S3-compatible object storage for images and voice notes
- Messaging: WhatsApp Cloud API, Gupshup, or Twilio for retailer conversations behind a provider interface
- AI: Sarvam AI for Indian-language voice transcription and Sarvam Vision document OCR, with OpenAI/Gemini as fallback providers behind a swappable provider interface
- Analytics: Postgres views first, then warehouse/BI when volume grows

See `BUILD_PLAN.md`, `src/domain/types.ts`, `src/lib/providers.ts`, `src/lib/permissions.ts`, and `supabase/schema.sql` for the production foundation.

## Core Domain Tables

- `users`: internal operators, admins, partner users, sales reps, and managers
- `field_agents`: sales-app identity, territory, manager, status
- `partners`: brand partner profile and dashboard permissions
- `outlets`: retailer profile, geo, route, verification state
- `field_messages`: raw retailer WhatsApp and sales-app text/media payloads
- `extractions`: AI-produced structured facts, confidence, model metadata
- `verification_tasks`: human review state, assignee, decision history
- `events`: verified sales, stockouts, merchandising, visits, orders
- `partner_metrics`: materialized partner dashboard summaries

## Provider Interfaces

```ts
interface MessagingProvider {
  sendMessage(to: string, body: string): Promise<void>;
  parseWebhook(payload: unknown): Promise<SourceMessage>;
}

interface ExtractionProvider {
  extract(message: SourceMessage): Promise<ExtractionResult>;
}

interface EvidenceStorageProvider {
  putObject(file: EvidenceFile): Promise<EvidenceReference>;
}

interface DashboardPublisher {
  publishVerifiedEvent(event: VerifiedEvent): Promise<void>;
}
```

## Build Phases

1. Replace prototype state with a typed API and database schema.
2. Add retailer WhatsApp webhook ingestion, sales-app submission APIs, and media storage.
3. Add AI extraction with confidence scoring and audit logs.
4. Build internal verification workflows, assignments, and comments.
5. Build partner auth, dashboard filters, exports, and verified-only metrics.
6. Add monitoring, replay tools, and provider failover.

## MVP Acceptance Criteria

- A sales rep can use the sales app to submit visits, orders, payments, and evidence.
- A retailer can send WhatsApp messages, bill/payment screenshots, complaints, and stock requests.
- The backend stores the raw source input and extracts a structured candidate record.
- Low-confidence or partner-visible records enter a verification queue.
- Internal ops can approve records or ask either the sales rep or retailer for clarification.
- Brand partners only see verified metrics and evidence.
