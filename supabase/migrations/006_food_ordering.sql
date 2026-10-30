alter table public.products add column if not exists product_type text not null default 'bakery';
alter table public.products add column if not exists preparation_minutes integer;
alter table public.products add column if not exists allow_asap boolean not null default true;
alter table public.products add column if not exists allow_scheduled boolean not null default true;
alter table public.products add column if not exists modifier_groups jsonb;

alter table public.orders add column if not exists order_mode text default 'scheduled';
alter table public.orders add column if not exists requested_fulfillment_at timestamptz;
alter table public.orders add column if not exists order_type text default 'bakery';

alter table public.products drop constraint if exists products_product_type_check;
alter table public.products add constraint products_product_type_check check (product_type in ('bakery', 'food'));
alter table public.orders drop constraint if exists orders_order_mode_check;
alter table public.orders add constraint orders_order_mode_check check (order_mode in ('asap', 'scheduled'));
alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders add constraint orders_order_type_check check (order_type in ('bakery', 'food', 'mixed'));
