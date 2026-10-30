create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null unique,
  role text not null default 'subscriber' check (role in ('administrator','shop_manager','customer','subscriber')),
  phone text,
  avatar text,
  billing_address jsonb,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  sku text,
  name text not null,
  slug text,
  category text not null default 'General',
  categories jsonb,
  short_description text,
  description text not null default '',
  price_min numeric(12,2) not null default 0,
  price_max numeric(12,2),
  regular_price numeric(12,2),
  sale_price numeric(12,2),
  on_sale boolean not null default false,
  image text not null default '',
  gallery jsonb,
  tags jsonb,
  is_customizable boolean not null default false,
  cake_types jsonb,
  weights jsonb,
  is_featured boolean not null default false,
  is_fast_moving boolean not null default false,
  stock_quantity integer,
  stock_status text default 'in_stock',
  seo jsonb,
  wc_id bigint unique,
  wc_permalink text,
  raw_wc_categories jsonb,
  variants jsonb,
  product_type text not null default 'bakery',
  preparation_minutes integer,
  allow_asap boolean not null default true,
  allow_scheduled boolean not null default true,
  modifier_groups jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null,
  description text,
  image text,
  parent_id text,
  count integer not null default 0,
  is_featured boolean not null default false,
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id text primary key,
  sub text,
  title text not null,
  highlight text,
  image text not null,
  btn_text text,
  target_link text,
  is_active boolean not null default true,
  order_num integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  pickup_branch text not null,
  pickup_person jsonb,
  billing_address jsonb,
  shipping_address jsonb,
  delivery_date date,
  delivery_time time,
  order_mode text default 'scheduled',
  requested_fulfillment_at timestamptz,
  order_type text default 'bakery',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  coupon_code text,
  total numeric(12,2) not null default 0,
  payment_method text not null default 'cod',
  payment_status text not null default 'unpaid',
  bank_receipt_url text,
  status text not null default 'pending_payment',
  order_notes text,
  tracking_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id text primary key,
  code text not null unique,
  type text not null,
  value numeric(12,2) not null,
  min_spend numeric(12,2),
  max_spend numeric(12,2),
  expiry_date timestamptz,
  usage_limit integer,
  usage_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  product_id text not null,
  product_name text not null,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  date timestamptz not null default now(),
  comment text not null,
  is_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_reply text
);

create table if not exists public.customers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null unique,
  phone text,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id text primary key default gen_random_uuid()::text,
  timestamp timestamptz not null default now(),
  user_name text not null,
  action text not null,
  details text not null,
  type text not null default 'info'
);

create table if not exists public.general_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Thinesh Bake House',
  store_tagline text not null default 'Your Favourite Baker Since 1982',
  store_email text not null default 'info@tbh.lk',
  store_phone text not null default '0777259245',
  store_address text not null default '180, Jaffna Road, Manipay',
  currency_symbol text not null default 'Rs.',
  maintenance_mode boolean not null default false,
  logo_url text,
  tax_rate_percent numeric(6,2) not null default 0,
  flat_shipping_fee numeric(12,2) not null default 0,
  free_shipping_threshold numeric(12,2) not null default 0,
  config jsonb not null default '{}'::jsonb,
  private_config jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_settings (
  id boolean primary key default true check (id),
  sender_name text not null default 'Thinesh Bake House',
  sender_email text not null default 'info@tbh.lk',
  smtp_host text not null default '',
  smtp_port integer not null default 587,
  smtp_user text not null default '',
  admin_notification_email text not null default 'admin@tbh.lk',
  enable_order_confirmations boolean not null default true,
  order_confirm_subject text not null default 'Your Thinesh Bake House order is confirmed',
  updated_at timestamptz not null default now()
);

create table if not exists public.sms_settings (
  id boolean primary key default true check (id),
  provider text not null default 'simulator',
  account_sid text not null default '',
  auth_token text not null default '',
  sender_id text not null default 'TBH',
  notify_on_new_order boolean not null default true,
  notify_on_status_change boolean not null default true,
  admin_alert_phone text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.woocommerce_settings (
  id boolean primary key default true check (id),
  store_url text not null default '',
  consumer_key text not null default '',
  consumer_secret text not null default '',
  is_active boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.general_settings (id) values (true) on conflict (id) do nothing;
insert into public.email_settings (id) values (true) on conflict (id) do nothing;
insert into public.sms_settings (id) values (true) on conflict (id) do nothing;
insert into public.woocommerce_settings (id) values (true) on conflict (id) do nothing;

insert into public.profiles (id, name, email, role)
select id, coalesce(raw_user_meta_data->>'name', 'Administrator'), email, 'administrator'
from auth.users where lower(email) = 'admin@tbh.lk'
on conflict (id) do update set name = excluded.name, email = excluded.email, role = 'administrator', updated_at = now();

alter table public.profiles enable row level security;
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

create index if not exists products_wc_id_idx on public.products(wc_id);
create index if not exists products_category_idx on public.products(category);
create index if not exists orders_customer_email_idx on public.orders(lower(customer_email));
create index if not exists reviews_product_id_idx on public.reviews(product_id);
