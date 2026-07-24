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
  sale_price numeric(10,2) not null default 0 check (sale_price >= 0),
  purchase_price numeric(10,2) check (purchase_price is null or purchase_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now()
);

alter table public.boxes
add column if not exists image_url text not null default '/alien-box.jpeg';

alter table public.boxes
add column if not exists sale_price numeric(10,2) not null default 0;

alter table public.boxes
add column if not exists purchase_price numeric(10,2);

alter table public.boxes
add column if not exists stock_quantity integer not null default 0;

create table if not exists public.box_images (
  id text primary key,
  box_id text not null references public.boxes(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists box_images_box_id_sort_order_idx
on public.box_images(box_id, sort_order);

create table if not exists public.box_complete_images (
  id text primary key,
  box_id text not null references public.boxes(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists box_complete_images_box_id_sort_order_idx
on public.box_complete_images(box_id, sort_order);

create table if not exists public.box_items (
  box_id text not null references public.boxes(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  sale_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (box_id, product_id)
);

-- Conserve le prix actuel lors de la première migration, puis la colonne
-- boxes.sale_price devient l'unique source de vérité.
update public.boxes as box
set sale_price = totals.sale_price
from (
  select box_id, sum(sale_price * quantity) as sale_price
  from public.box_items
  group by box_id
) as totals
where box.id = totals.box_id
  and box.sale_price = 0;

create table if not exists public.events (
  id text primary key,
  title text not null,
  description text not null default '',
  event_date date,
  location text not null default '',
  show_on_front_office boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled')),
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text,
  delivery_method text not null
    check (delivery_method in ('mondial_relay_pickup', 'laposte_pickup', 'mondial_relay_home', 'laposte_home')),
  delivery_carrier text not null,
  delivery_mode text not null check (delivery_mode in ('pickup', 'home')),
  delivery_price numeric(10,2) not null check (delivery_price >= 0),
  delivery_address text,
  delivery_postal_code text,
  delivery_city text,
  relay_point jsonb,
  items jsonb not null,
  items_total numeric(10,2) not null check (items_total >= 0),
  total numeric(10,2) not null check (total >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);

alter table public.events
alter column event_date drop not null;

alter table public.products enable row level security;
alter table public.boxes enable row level security;
alter table public.box_images enable row level security;
alter table public.box_complete_images enable row level security;
alter table public.box_items enable row level security;
alter table public.events enable row level security;
alter table public.orders enable row level security;

insert into storage.buckets (id, name, public)
values ('box-images', 'box-images', true)
on conflict (id) do update set public = excluded.public;

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

drop policy if exists "box_images_select_public" on public.box_images;
create policy "box_images_select_public"
on public.box_images
for select
to anon, authenticated
using (true);

drop policy if exists "box_images_write_authenticated" on public.box_images;
create policy "box_images_write_authenticated"
on public.box_images
for all
to authenticated
using (true)
with check (true);

drop policy if exists "box_complete_images_select_public" on public.box_complete_images;
create policy "box_complete_images_select_public"
on public.box_complete_images
for select
to anon, authenticated
using (true);

drop policy if exists "box_complete_images_write_authenticated" on public.box_complete_images;
create policy "box_complete_images_write_authenticated"
on public.box_complete_images
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

drop policy if exists "events_select_public" on public.events;
create policy "events_select_public"
on public.events
for select
to anon, authenticated
using (true);

drop policy if exists "events_write_authenticated" on public.events;
create policy "events_write_authenticated"
on public.events
for all
to authenticated
using (true)
with check (true);

drop policy if exists "orders_select_authenticated" on public.orders;
create policy "orders_select_authenticated"
on public.orders for select to authenticated using (true);

drop policy if exists "orders_update_authenticated" on public.orders;
create policy "orders_update_authenticated"
on public.orders for update to authenticated using (true) with check (true);

drop policy if exists "box_images_storage_select_public" on storage.objects;
create policy "box_images_storage_select_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'box-images');

drop policy if exists "box_images_storage_insert_authenticated" on storage.objects;
create policy "box_images_storage_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'box-images');

drop policy if exists "box_images_storage_update_authenticated" on storage.objects;
create policy "box_images_storage_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'box-images')
with check (bucket_id = 'box-images');

drop policy if exists "box_images_storage_delete_authenticated" on storage.objects;
create policy "box_images_storage_delete_authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'box-images');
