# Cloud Deployment

## 1. Supabase

Project reference:

```txt
zeoctecnrbywmwgbrpnv
```

Apply the schema in:

```txt
supabase/schema.sql
```

The safest first path is Supabase Dashboard -> SQL Editor -> paste `supabase/schema.sql` -> Run.

Seed starter demo data with:

```txt
supabase/seed_demo.sql
```

Enable table protection with:

```txt
supabase/enable_rls.sql
```

The app uses server-side actions with `SUPABASE_SERVICE_ROLE_KEY`, so RLS can be enabled while the backend still writes safely. Do not expose the service role key in browser code.

## 2. Environment Variables

Add these variables in Vercel. Do not commit real secrets.

```txt
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SARVAM_API_KEY
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_TRANSCRIPTION_MODEL
GEMINI_API_KEY
WHATSAPP_PROVIDER
WHATSAPP_WEBHOOK_VERIFY_TOKEN
WHATSAPP_ACCESS_TOKEN
```

Use `.env.example` as the template.

## 3. Vercel

Import the GitHub repo:

```txt
https://github.com/czr41/Distribution-Intel
```

Use:

```txt
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

## 4. WhatsApp Webhook

After Vercel deploys, the webhook route target will be:

```txt
https://YOUR-VERCEL-DOMAIN/api/webhooks/whatsapp
```

The route currently:

1. Verifies the Meta webhook signature/token.
2. Stores raw payloads in `incoming_messages`.
3. Downloads and stores WhatsApp media.
4. Dispatches AI extraction.
5. Creates `verification_queue` items.

## 5. Security Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` only for browser-safe operations.
- Brand dashboards must use verified records only.
- Brand partner access must be filtered by assigned brand.
