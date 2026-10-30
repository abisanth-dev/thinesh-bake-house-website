alter table public.orders add column if not exists billing_address jsonb;
alter table public.orders add column if not exists delivery_date date;
alter table public.orders add column if not exists delivery_time time;
