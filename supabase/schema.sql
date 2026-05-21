create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'super_admin',
      'operations_manager',
      'admin_operator',
      'field_executive',
      'brand_partner_viewer',
      'brand_partner_manager'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'message_type') then
    create type message_type as enum ('text', 'voice', 'image', 'document', 'location', 'video');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'processing_status') then
    create type processing_status as enum (
      'received',
      'processing',
      'extraction_ready',
      'needs_review',
      'clarification_required',
      'verified',
      'rejected',
      'linked_to_record'
    );
  end if;
end
$$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  phone text,
  role user_role not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_person text,
  contact_email text,
  contact_phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists territories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  region text,
  manager_id uuid references users(id),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists field_executives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  phone text not null,
  whatsapp_number text not null,
  territory_id uuid references territories(id),
  manager_id uuid references users(id),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  phone text,
  whatsapp_number text,
  address text,
  city text not null,
  state text,
  pincode text,
  latitude numeric,
  longitude numeric,
  category text,
  channel_type text,
  territory_id uuid references territories(id),
  assigned_executive_id uuid references field_executives(id),
  status text not null default 'prospect',
  credit_status text,
  payment_terms text,
  monthly_potential numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outlet_brands (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references outlets(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  status text not null default 'active',
  onboarded_at timestamptz,
  unique (outlet_id, brand_id)
);

create table if not exists incoming_messages (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_message_id text not null,
  sender_phone text not null,
  sender_user_id uuid references users(id),
  message_type message_type not null,
  text_body text,
  media_url text,
  media_storage_path text,
  latitude numeric,
  longitude numeric,
  received_at timestamptz not null,
  processing_status processing_status not null default 'received',
  raw_payload_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_message_id)
);

create table if not exists message_ai_extractions (
  id uuid primary key default gen_random_uuid(),
  incoming_message_id uuid not null references incoming_messages(id) on delete cascade,
  extraction_type text not null,
  transcript_text text,
  ocr_text text,
  detected_language text,
  translated_text text,
  structured_json jsonb not null,
  confidence_score numeric not null default 0,
  status processing_status not null default 'needs_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verification_queue (
  id uuid primary key default gen_random_uuid(),
  incoming_message_id uuid not null references incoming_messages(id) on delete cascade,
  extraction_id uuid references message_ai_extractions(id) on delete set null,
  assigned_admin_id uuid references users(id),
  queue_status processing_status not null default 'needs_review',
  priority text not null default 'medium',
  review_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references outlets(id),
  field_executive_id uuid references field_executives(id),
  territory_id uuid references territories(id),
  visit_datetime timestamptz not null,
  visit_type text not null,
  productive boolean not null default false,
  outcome text,
  notes text,
  source_message_id uuid references incoming_messages(id),
  verified_by uuid references users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists skus (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  code text,
  category text,
  unit text,
  mrp numeric,
  status text not null default 'active'
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references outlets(id),
  brand_id uuid references brands(id),
  field_executive_id uuid references field_executives(id),
  expected_value numeric,
  expected_delivery_date date,
  status text not null default 'intent_captured',
  source_message_id uuid references incoming_messages(id),
  verified_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  sku_id uuid references skus(id),
  quantity numeric not null,
  unit_price numeric,
  total_value numeric
);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references outlets(id),
  brand_id uuid references brands(id),
  field_executive_id uuid references field_executives(id),
  bill_number text,
  bill_date date,
  total_amount numeric,
  payment_status text,
  bill_image_path text,
  ocr_text text,
  source_message_id uuid references incoming_messages(id),
  verified_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  sku_id uuid references skus(id),
  quantity numeric not null,
  unit_price numeric,
  discount numeric,
  tax numeric,
  total_value numeric
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references outlets(id),
  brand_id uuid references brands(id),
  bill_id uuid references bills(id),
  amount_due numeric not null default 0,
  amount_collected numeric not null default 0,
  due_date date,
  promised_payment_date date,
  payment_mode text,
  status text not null default 'due',
  risk_level text not null default 'medium',
  source_message_id uuid references incoming_messages(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists competitor_insights (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  outlet_id uuid references outlets(id),
  territory_id uuid references territories(id),
  competitor_name text not null,
  product_name text,
  price_point numeric,
  margin_or_scheme text,
  insight_text text not null,
  impact_level text not null default 'medium',
  evidence_message_id uuid references incoming_messages(id),
  verified_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  task_type text not null,
  assigned_to uuid references users(id),
  outlet_id uuid references outlets(id),
  brand_id uuid references brands(id),
  due_date date,
  priority text not null default 'medium',
  status text not null default 'open',
  source_message_id uuid references incoming_messages(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  previous_value_json jsonb,
  new_value_json jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.incoming_messages') is not null then
    create index if not exists idx_incoming_messages_status on incoming_messages(processing_status);
    create index if not exists idx_incoming_messages_received_at on incoming_messages(received_at desc);
  end if;

  if to_regclass('public.verification_queue') is not null then
    create index if not exists idx_verification_queue_status_priority on verification_queue(queue_status, priority);
  end if;

  if to_regclass('public.outlets') is not null then
    create index if not exists idx_outlets_city_status on outlets(city, status);
  end if;

  if to_regclass('public.orders') is not null then
    create index if not exists idx_orders_brand_status on orders(brand_id, status);
  end if;

  if to_regclass('public.bills') is not null then
    create index if not exists idx_bills_brand_date on bills(brand_id, bill_date desc);
  end if;

  if to_regclass('public.payments') is not null then
    create index if not exists idx_payments_brand_status on payments(brand_id, status);
  end if;

  if to_regclass('public.tasks') is not null then
    create index if not exists idx_tasks_assigned_status on tasks(assigned_to, status);
  end if;

  if to_regclass('public.integration_settings') is not null then
    create index if not exists idx_integration_settings_provider_status on integration_settings(provider, status);
  end if;

  if to_regclass('public.ai_provider_settings') is not null then
    create index if not exists idx_ai_provider_settings_status on ai_provider_settings(status, created_at desc);
  end if;
end
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'whatsapp-media',
  'whatsapp-media',
  false,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'audio/aac',
    'audio/amr',
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'video/mp4',
    'video/3gpp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
