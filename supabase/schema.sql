create table if not exists public.products (
  id text primary key,
  name text not null,
  purchase_unit_price numeric(10,2) not null default 0,
  default_sale_price numeric(10,2) not null default 0,
  stock_quantity integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.boxes (
  id text primary key,
  name text not null,
  description text not null default '',
  image_url text not null default '/alien-box.jpeg',
  show_on_front_office boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.boxes
add column if not exists image_url text not null default '/alien-box.jpeg';

create table if not exists public.box_items (
  box_id text not null references public.boxes(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  sale_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (box_id, product_id)
);

alter table public.products enable row level security;
alter table public.boxes enable row level security;
alter table public.box_items enable row level security;

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "products_write_authenticated" on public.products;
create policy "products_write_authenticated"
on public.products
for all
to authenticated
using (true)
with check (true);

drop policy if exists "boxes_select_public" on public.boxes;
create policy "boxes_select_public"
on public.boxes
for select
to anon, authenticated
using (true);

drop policy if exists "boxes_write_authenticated" on public.boxes;
create policy "boxes_write_authenticated"
on public.boxes
for all
to authenticated
using (true)
with check (true);

drop policy if exists "box_items_select_public" on public.box_items;
create policy "box_items_select_public"
on public.box_items
for select
to anon, authenticated
using (true);

drop policy if exists "box_items_write_authenticated" on public.box_items;
create policy "box_items_write_authenticated"
on public.box_items
for all
to authenticated
using (true)
with check (true);
