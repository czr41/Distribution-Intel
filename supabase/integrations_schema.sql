create table if not exists integration_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  display_name text,
  status text not null default 'draft',
  phone_number_id text,
  whatsapp_business_account_id text,
  business_portfolio_id text,
  graph_api_version text not null default 'v25.0',
  webhook_verify_token text,
  access_token text,
  app_secret text,
  last_test_status text,
  last_error text,
  config_json jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_provider_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'gemini',
  model text not null default 'gemini-2.5-flash',
  status text not null default 'draft',
  base_url text,
  api_key text,
  extraction_mode text not null default 'structured_json',
  last_test_status text,
  last_error text,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_integration_settings_provider_status on integration_settings(provider, status);
create index if not exists idx_ai_provider_settings_status on ai_provider_settings(status, created_at desc);

insert into integration_settings (
  provider,
  display_name,
  status,
  graph_api_version,
  last_test_status
)
values (
  'meta_whatsapp',
  'Meta WhatsApp Cloud API',
  'draft',
  'v25.0',
  'Not tested'
)
on conflict (provider) do nothing;

insert into ai_provider_settings (
  provider,
  model,
  status,
  extraction_mode,
  last_test_status
)
select
  'gemini',
  'gemini-2.5-flash',
  'draft',
  'structured_json',
  'Not tested'
where not exists (select 1 from ai_provider_settings);
