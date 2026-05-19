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

## 2. Environment Variables

Add these variables in Vercel. Do not commit real secrets.

```txt
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
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

The route is not implemented yet. Build order:

1. Create the route.
2. Verify provider signature/token.
3. Store raw payload in `incoming_messages`.
4. Dispatch AI extraction.
5. Create `verification_queue` item.

## 5. Security Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` only for browser-safe operations.
- Brand dashboards must use verified records only.
- Brand partner access must be filtered by assigned brand.
