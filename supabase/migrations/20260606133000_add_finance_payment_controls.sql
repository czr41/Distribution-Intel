alter table public.payments
  add column if not exists receipt_number text,
  add column if not exists collector_name text,
  add column if not exists allocation_summary text,
  add column if not exists write_off_status text not null default 'not_requested',
  add column if not exists dispute_status text not null default 'not_disputed',
  add column if not exists settlement_status text not null default 'unreconciled',
  add column if not exists settlement_reference text,
  add column if not exists settlement_date date;

alter table public.outlets
  add column if not exists credit_limit numeric not null default 0,
  add column if not exists credit_hold_status text not null default 'clear';

create index if not exists idx_payments_bill on public.payments(bill_id);
create index if not exists idx_payments_settlement on public.payments(settlement_status, settlement_date);
create index if not exists idx_payments_dispute on public.payments(dispute_status);
create index if not exists idx_outlets_credit_hold on public.outlets(credit_hold_status);
