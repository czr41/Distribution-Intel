alter table public.bills
  add column if not exists order_id uuid references public.orders(id) on delete set null;

create index if not exists idx_bills_order on public.bills(order_id);
