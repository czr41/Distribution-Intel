# Distribution Command Center Build Plan

This repo currently has two layers:

- `index.html`, `styles.css`, `app.js`: runnable browser prototype for the command center.
- `src/` and `supabase/`: production foundation for the Next.js/Supabase implementation.

## Immediate Build Order

1. Convert prototype into a Next.js App Router project.
2. Install UI/data stack: TypeScript, Tailwind, shadcn/ui, Zod, TanStack Table, Recharts.
3. Apply `supabase/schema.sql`.
4. Add Supabase auth and role mapping.
5. Move local master-data create flows into server actions:
   - add salesman / field executive
   - add outlet
   - add brand client
6. Build WhatsApp webhook ingestion against `MessagingProvider`.
7. Add AI extraction provider implementation against `AIExtractionProvider`.
8. Build verification queue from `incoming_messages`, `message_ai_extractions`, and `verification_queue`.
9. Publish only verified records to brand dashboards.

## Module Boundaries

- `src/domain`: shared business types and status contracts.
- `src/lib/permissions.ts`: centralized role and brand access checks.
- `src/lib/providers.ts`: swappable provider interfaces for WhatsApp, AI, and storage.
- `supabase/schema.sql`: initial relational schema and indexes.

## Next.js Route Targets

```txt
app/(auth)/login
app/(dashboard)/command-center
app/(dashboard)/inbox
app/(dashboard)/verification
app/(dashboard)/outlets
app/(dashboard)/outlets/[id]
app/(dashboard)/visits
app/(dashboard)/bills
app/(dashboard)/orders
app/(dashboard)/payments
app/(dashboard)/tasks
app/(dashboard)/competitor-intel
app/(dashboard)/reports
app/(dashboard)/brands
app/(dashboard)/territories
app/(dashboard)/users
app/(dashboard)/settings
app/api/webhooks/whatsapp
app/api/ai/process-message
app/api/reports/generate
```

## Non-Negotiable Data Rules

- Raw incoming WhatsApp messages are immutable.
- AI drafts are stored separately from verified records.
- Brand dashboards query verified data only.
- Important edits create audit logs.
- Brand partner access must pass `assertBrandAccess`.
- Provider-specific WhatsApp and AI code stays behind interfaces.
