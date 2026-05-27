# shipd2r Command Center

This is the first executable MVP slice for the build brief:

> Field team uses WhatsApp. Internal team uses command center. Brand partners see verified dashboards.

The current implementation is a deployed Next.js command-center MVP backed by Supabase.

## What Is Built

- WhatsApp-style field intake and Meta webhook route
- AI extraction provider settings for Sarvam AI, OpenAI, and Gemini
- Human-in-the-loop verification queue
- Internal command center metrics
- Partner dashboard that only shows verified records
- Supabase-backed CRUD for outlets, salesmen, clients/brands, territories, tasks, payments, orders, and bills
- Next.js App Router scaffold under `src/app`
- Typed command-center client component under `src/features/command-center`

Production app:

```txt
https://distribution-intel.vercel.app
```

The prototype now supports adding:

- Salesman / field executive from `Ops`
- Outlet from `Outlets`
- Client / brand from `Partners`

These records are written to Supabase through server actions.

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
- Messaging: WhatsApp Cloud API, Gupshup, or Twilio behind a provider interface
- AI: Sarvam AI for Indian-language voice transcription and Sarvam Vision document OCR, with OpenAI/Gemini as fallback providers behind a swappable provider interface
- Analytics: Postgres views first, then warehouse/BI when volume grows

See `BUILD_PLAN.md`, `src/domain/types.ts`, `src/lib/providers.ts`, `src/lib/permissions.ts`, and `supabase/schema.sql` for the production foundation.

## Core Domain Tables

- `users`: internal operators, admins, partner users, field managers
- `field_agents`: WhatsApp identity, territory, manager, status
- `partners`: brand partner profile and dashboard permissions
- `outlets`: retailer profile, geo, route, verification state
- `field_messages`: raw WhatsApp text/media payloads
- `extractions`: AI-produced structured facts, confidence, model metadata
- `verification_tasks`: human review state, assignee, decision history
- `events`: verified sales, stockouts, merchandising, visits, orders
- `partner_metrics`: materialized partner dashboard summaries

## Provider Interfaces

```ts
interface MessagingProvider {
  sendMessage(to: string, body: string): Promise<void>;
  parseWebhook(payload: unknown): Promise<FieldMessage>;
}

interface ExtractionProvider {
  extract(message: FieldMessage): Promise<ExtractionResult>;
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
2. Add WhatsApp webhook ingestion and media storage.
3. Add AI extraction with confidence scoring and audit logs.
4. Build internal verification workflows, assignments, and comments.
5. Build partner auth, dashboard filters, exports, and verified-only metrics.
6. Add monitoring, replay tools, and provider failover.

## MVP Acceptance Criteria

- A field agent can send a WhatsApp update in natural language.
- The backend stores the raw message and extracts a structured candidate record.
- Low-confidence or partner-visible records enter a verification queue.
- Internal ops can approve or send records back for clarification.
- Brand partners only see verified metrics and evidence.
