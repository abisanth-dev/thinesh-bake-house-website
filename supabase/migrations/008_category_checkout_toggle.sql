-- Per-category checkout switch: when false, products in the category are shown on the storefront
-- but cannot be opened, added to the cart or ordered.

alter table public.categories add column if not exists checkout_enabled boolean not null default true;
