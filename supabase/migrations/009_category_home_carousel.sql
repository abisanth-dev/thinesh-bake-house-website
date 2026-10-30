-- Home page category carousels: a featured category gets a position (the order it was featured in)
-- plus its own heading and short description. A null position means the category is not on the home page.

alter table public.categories add column if not exists home_featured_order integer;
alter table public.categories add column if not exists home_title text;
alter table public.categories add column if not exists home_description text;
