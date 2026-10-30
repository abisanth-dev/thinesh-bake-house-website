-- Online card payments (Dialog Genie): the gateway's transaction id and when payment was confirmed.
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists paid_at timestamptz;
create index if not exists orders_payment_reference_idx on public.orders (payment_reference);
