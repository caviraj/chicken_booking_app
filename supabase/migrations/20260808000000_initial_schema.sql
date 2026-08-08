-- =============================================================================
-- PHASE 1: Database Schema & RLS Setup — Meat Booking & Delivery System
-- Migration File: 20260808000000_initial_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLES CREATION (ordered by foreign key dependencies)
-- -----------------------------------------------------------------------------

-- Admin Users Table
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  created_at timestamptz default now()
);

-- Customers Table (shared by website login AND WhatsApp phone-based identity)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique,
  email text unique,
  full_name text,
  auth_user_id uuid references auth.users(id) on delete cascade,
  preferred_language text default 'ta',
  created_at timestamptz default now()
);

-- WhatsApp Conversation State Machine Table
create table if not exists public.conversation_state (
  phone_number text primary key,
  current_step text not null default 'START',
  draft_order jsonb default '{}',
  updated_at timestamptz default now()
);

-- Daily Meat Rates Table
create table if not exists public.rates (
  id uuid primary key default gen_random_uuid(),
  meat_type text not null,
  rate_per_kg numeric not null,
  effective_date date not null default current_date,
  updated_by uuid references public.admin_users(id),
  created_at timestamptz default now(),
  unique(meat_type, effective_date)
);

-- Orders Table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  source text not null default 'website',
  meat_type text not null,
  quantity_kg numeric not null,
  cutting_type text not null,
  delivery_date date not null,
  delivery_time_slot text not null,
  fulfillment_type text not null default 'delivery',
  delivery_address text,
  delivery_zone text,
  delivery_charge numeric default 0,
  item_total numeric not null,
  grand_total numeric not null,
  payment_method text not null default 'online',
  payment_status text default 'pending',
  order_status text default 'confirmed',
  razorpay_payment_link text,
  razorpay_payment_id text,
  created_at timestamptz default now()
);

-- Delivery Zones Table
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  zone_name text not null,
  max_distance_km numeric,
  delivery_charge numeric not null,
  active boolean default true
);

-- Admin Settings Table
create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  cod_enabled boolean default true,
  delivery_enabled_days text[] default array['MON','TUE','WED','THU','FRI','SAT','SUN'],
  cleaning_day boolean default false,
  order_cutoff_time time default '20:00',
  daily_stock_limit_kg numeric,
  shop_lat numeric,
  shop_lng numeric,
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 2. INDEXES
-- -----------------------------------------------------------------------------
create index if not exists idx_customers_auth_user_id on public.customers(auth_user_id);
create index if not exists idx_customers_phone_number on public.customers(phone_number);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_rates_meat_type_effective_date on public.rates(meat_type, effective_date desc);

-- -----------------------------------------------------------------------------
-- 3. HELPER SECURITY FUNCTIONS
-- -----------------------------------------------------------------------------

-- Helper function to check if the requesting user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.admin_users
    where email = (auth.jwt() ->> 'email')
       or id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
alter table public.admin_users enable row level security;
alter table public.customers enable row level security;
alter table public.conversation_state enable row level security;
alter table public.rates enable row level security;
alter table public.orders enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.admin_settings enable row level security;

-- Admin Users Policies
create policy "Admins can view admin_users"
  on public.admin_users for select
  using (public.is_admin());

create policy "Admins can modify admin_users"
  on public.admin_users for all
  using (public.is_admin());

-- Customers Policies
-- Customer can only see/update their own row; Admins see/update all.
create policy "Customers can view own profile or admin views all"
  on public.customers for select
  using (auth_user_id = auth.uid() or public.is_admin());

create policy "Customers can insert own profile or admin inserts"
  on public.customers for insert
  with check (auth_user_id = auth.uid() or public.is_admin());

create policy "Customers can update own profile or admin updates all"
  on public.customers for update
  using (auth_user_id = auth.uid() or public.is_admin());

-- Orders Policies
-- Customer can only see/insert their own rows (matched via customer_id); admin role sees all.
create policy "Customers can view own orders or admin views all"
  on public.orders for select
  using (
    customer_id in (select id from public.customers where auth_user_id = auth.uid())
    or public.is_admin()
  );

create policy "Customers can create own orders or admin creates"
  on public.orders for insert
  with check (
    customer_id in (select id from public.customers where auth_user_id = auth.uid())
    or public.is_admin()
  );

create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin());

-- Rates Policies
-- Public read, admin-only write.
create policy "Public can view rates"
  on public.rates for select
  using (true);

create policy "Admins can insert rates"
  on public.rates for insert
  with check (public.is_admin());

create policy "Admins can update rates"
  on public.rates for update
  using (public.is_admin());

create policy "Admins can delete rates"
  on public.rates for delete
  using (public.is_admin());

-- Delivery Zones Policies
-- Public read, admin-only write.
create policy "Public can view delivery zones"
  on public.delivery_zones for select
  using (true);

create policy "Admins can insert delivery zones"
  on public.delivery_zones for insert
  with check (public.is_admin());

create policy "Admins can update delivery zones"
  on public.delivery_zones for update
  using (public.is_admin());

create policy "Admins can delete delivery zones"
  on public.delivery_zones for delete
  using (public.is_admin());

-- Admin Settings Policies
-- Public read, admin-only write.
create policy "Public can view admin settings"
  on public.admin_settings for select
  using (true);

create policy "Admins can insert admin settings"
  on public.admin_settings for insert
  with check (public.is_admin());

create policy "Admins can update admin settings"
  on public.admin_settings for update
  using (public.is_admin());

-- Conversation State Policies
-- Managed by backend/service_role or admin user.
create policy "Admins can manage conversation state"
  on public.conversation_state for all
  using (public.is_admin());
