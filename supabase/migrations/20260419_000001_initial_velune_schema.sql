create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'payment_method'
  ) then
    create type public.payment_method as enum ('cod', 'manual_transfer');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'payment_status'
  ) then
    create type public.payment_status as enum (
      'pending',
      'proof_uploaded',
      'paid',
      'failed',
      'not_required'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'order_status'
  ) then
    create type public.order_status as enum (
      'new',
      'awaiting_payment',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'delivered',
      'cancelled'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_users_email_lowercase check (email = lower(email))
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  notes_top text[] not null default '{}',
  notes_middle text[] not null default '{}',
  notes_base text[] not null default '{}',
  category text,
  is_active boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null,
  price numeric(10, 2) not null check (price >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  sku text not null unique,
  is_active boolean not null default true
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  province text not null,
  postal_code text,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  order_status public.order_status not null default 'new',
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  shipping_amount numeric(10, 2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  payment_proof_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_variant_id uuid references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type text not null,
  quantity integer not null,
  reference text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_is_active on public.products (is_active);
create index if not exists idx_products_is_featured on public.products (is_featured);
create index if not exists idx_product_variants_product_id on public.product_variants (product_id);
create index if not exists idx_product_images_product_id on public.product_images (product_id);
create index if not exists idx_orders_order_number on public.orders (order_number);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_order_status on public.orders (order_status);
create index if not exists idx_orders_payment_status on public.orders (payment_status);
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_inventory_movements_variant_id on public.inventory_movements (product_variant_id);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_active = true
  );
$$;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "Admins can manage admin_users" on public.admin_users;
create policy "Admins can manage admin_users"
on public.admin_users
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
using (is_active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Public can read active product variants" on public.product_variants;
create policy "Public can read active product variants"
on public.product_variants
for select
using (
  is_active = true
  and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.is_active = true
  )
);

drop policy if exists "Admins can manage product variants" on public.product_variants;
create policy "Admins can manage product variants"
on public.product_variants
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Public can read active product images" on public.product_images;
create policy "Public can read active product images"
on public.product_images
for select
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active = true
  )
);

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
on public.product_images
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders
for insert
with check (true);

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
on public.orders
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Public can create order items" on public.order_items;
create policy "Public can create order items"
on public.order_items
for insert
with check (true);

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
on public.order_items
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can manage inventory movements" on public.inventory_movements;
create policy "Admins can manage inventory movements"
on public.inventory_movements
for all
using (public.is_admin_user())
with check (public.is_admin_user());

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "Public can read product images bucket" on storage.objects;
create policy "Public can read product images bucket"
on storage.objects
for select
using (bucket_id = 'product-images');

drop policy if exists "Admins can manage product images bucket" on storage.objects;
create policy "Admins can manage product images bucket"
on storage.objects
for all
using (
  bucket_id = 'product-images'
  and public.is_admin_user()
)
with check (
  bucket_id = 'product-images'
  and public.is_admin_user()
);

drop policy if exists "Public can upload payment proofs" on storage.objects;
create policy "Public can upload payment proofs"
on storage.objects
for insert
with check (bucket_id = 'payment-proofs');

drop policy if exists "Admins can read payment proofs" on storage.objects;
create policy "Admins can read payment proofs"
on storage.objects
for select
using (
  bucket_id = 'payment-proofs'
  and public.is_admin_user()
);

drop policy if exists "Admins can manage payment proofs" on storage.objects;
create policy "Admins can manage payment proofs"
on storage.objects
for all
using (
  bucket_id = 'payment-proofs'
  and public.is_admin_user()
)
with check (
  bucket_id = 'payment-proofs'
  and public.is_admin_user()
);
