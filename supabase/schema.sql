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

create table if not exists public.box_items (
  box_id text not null references public.boxes(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  sale_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (box_id, product_id)
);

create table if not exists public.events (
  id text primary key,
  title text not null,
  description text not null default '',
  event_date date,
  location text not null default '',
  show_on_front_office boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.events
alter column event_date drop not null;

alter table public.products enable row level security;
alter table public.boxes enable row level security;
alter table public.box_images enable row level security;
alter table public.box_items enable row level security;
alter table public.events enable row level security;

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
