create table if not exists public.brand_branches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  office_name text not null,
  region text,
  city text,
  state text,
  address text,
  contact_person text,
  contact_phone text,
  contact_email text,
  procurement_role text,
  lead_time_days numeric not null default 0,
  replenishment_mode text,
  status text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  branch_id uuid references public.brand_branches(id),
  po_number text,
  order_date date not null default current_date,
  expected_date date,
  total_value numeric not null default 0,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  sku_id uuid references public.skus(id),
  quantity numeric not null,
  unit_cost numeric,
  total_value numeric
);

create table if not exists public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references public.purchase_orders(id),
  receipt_number text,
  received_date date not null default current_date,
  warehouse text not null default 'Distributor warehouse',
  status text not null default 'received',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  sku_id uuid references public.skus(id),
  branch_id uuid references public.brand_branches(id),
  purchase_order_id uuid references public.purchase_orders(id),
  goods_receipt_id uuid references public.goods_receipts(id),
  movement_type text not null default 'inbound_procurement',
  from_location text,
  to_location text,
  quantity numeric not null default 0,
  movement_value numeric not null default 0,
  expected_date date,
  status text not null default 'open',
  document_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_payables (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  branch_id uuid references public.brand_branches(id),
  purchase_order_id uuid references public.purchase_orders(id),
  invoice_number text,
  invoice_date date,
  amount_due numeric not null default 0,
  amount_paid numeric not null default 0,
  due_date date,
  status text not null default 'due',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brand_branches_brand_status on public.brand_branches(brand_id, status);
create index if not exists idx_purchase_orders_brand_status on public.purchase_orders(brand_id, status);
create index if not exists idx_inventory_movements_sku_type on public.inventory_movements(sku_id, movement_type);
create index if not exists idx_inventory_movements_brand_date on public.inventory_movements(brand_id, created_at desc);

alter table public.brand_branches enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.goods_receipts enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.supplier_payables enable row level security;

grant select, insert, update, delete on table public.brand_branches to anon, authenticated;
grant select, insert, update, delete on table public.purchase_orders to anon, authenticated;
grant select, insert, update, delete on table public.purchase_order_items to anon, authenticated;
grant select, insert, update, delete on table public.goods_receipts to anon, authenticated;
grant select, insert, update, delete on table public.inventory_movements to anon, authenticated;
grant select, insert, update, delete on table public.supplier_payables to anon, authenticated;
