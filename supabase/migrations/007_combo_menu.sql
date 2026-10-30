-- Combo menu group: combo products bundle existing catalogue items at a discounted price,
-- and every category is assigned to one of the three storefront menu groups.

alter table public.products add column if not exists combo_items jsonb;

alter table public.products drop constraint if exists products_product_type_check;
alter table public.products add constraint products_product_type_check check (product_type in ('bakery', 'food', 'combo'));

alter table public.categories add column if not exists menu_group text not null default 'bakery';

alter table public.categories drop constraint if exists categories_menu_group_check;
alter table public.categories add constraint categories_menu_group_check check (menu_group in ('bakery', 'food', 'combo'));

create index if not exists products_product_type_idx on public.products (product_type);
create index if not exists categories_menu_group_idx on public.categories (menu_group);
