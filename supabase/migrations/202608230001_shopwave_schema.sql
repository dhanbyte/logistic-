-- ============================================================================
-- ShopWave Logistics — Indian E-Commerce Shipping Aggregator Schema Migration
-- Migration: 202608230001_shopwave_schema.sql
-- Self-contained: Works on brand-new or existing Supabase projects.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Helper Functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Create Enums
do $$ begin
  create type public.currency_code as enum ('INR', 'PLN', 'EUR', 'USD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'DRAFT',
    'PENDING_PICKUP',
    'READY_TO_SHIP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'NDR',
    'RTO_INITIATED',
    'RTO_DELIVERED',
    'CANCELLED',
    'RETURN_REQUESTED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ecommerce_shipment_status as enum (
    'MANIFESTED',
    'PICKUP_SCHEDULED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'UNDELIVERED_ATTEMPT',
    'NDR',
    'RTO_INITIATED',
    'RTO_IN_TRANSIT',
    'RTO_DELIVERED',
    'CANCELLED',
    'LOST',
    'DAMAGED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_mode as enum ('PREPAID', 'COD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ndr_status as enum (
    'OPEN',
    'ACTION_REQUESTED',
    'REATTEMPT_SCHEDULED',
    'RTO_REQUESTED',
    'RESOLVED',
    'CLOSED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rto_status as enum (
    'INITIATED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'DISPUTED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.return_status as enum (
    'REQUESTED',
    'APPROVED',
    'PICKUP_SCHEDULED',
    'PICKED_UP',
    'IN_TRANSIT',
    'RECEIVED',
    'REJECTED',
    'REFUNDED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.settlement_status as enum (
    'PENDING',
    'PROCESSING',
    'REMITTED',
    'FAILED',
    'ON_HOLD'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shipping_zone as enum (
    'ZONE_A',
    'ZONE_B',
    'ZONE_C',
    'ZONE_D',
    'ZONE_E'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.wallet_txn_type as enum ('CREDIT', 'DEBIT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.wallet_txn_category as enum (
    'WALLET_RECHARGE',
    'SHIPPING_DEDUCTION',
    'WEIGHT_DISCREPANCY',
    'COD_REMITTANCE',
    'REFUND',
    'PENALTY'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_kind as enum (
    'LABEL',
    'MANIFEST',
    'TAX_INVOICE',
    'EWAY_BILL',
    'POD',
    'CMR',
    'OTHER'
  );
exception when duplicate_object then null; end $$;

-- 3. Profiles Table (Linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  reporting_currency public.currency_code not null default 'INR',
  phone text default '',
  company_name text default '',
  gstin text default '',
  pan text default '',
  kyc_status text default 'PENDING',
  wallet_balance numeric(14,2) not null default 0.00 check (wallet_balance >= -5000.00),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure columns exist if table was already created in earlier migrations
alter table public.profiles
  add column if not exists phone text default '',
  add column if not exists company_name text default '',
  add column if not exists gstin text default '',
  add column if not exists pan text default '',
  add column if not exists kyc_status text default 'PENDING',
  add column if not exists wallet_balance numeric(14,2) not null default 0.00;

-- Auto-create profile trigger on Supabase user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. Seller Accounts
create table if not exists public.seller_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  brand_name text not null,
  gstin text,
  pan text,
  billing_address text not null,
  city text not null,
  state text not null,
  pincode varchar(10) not null,
  email text not null,
  phone varchar(20) not null,
  kyc_status text not null default 'PENDING' check (kyc_status in ('PENDING', 'VERIFIED', 'REJECTED')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- 5. Warehouses / Pickup Hubs
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  warehouse_name text not null,
  contact_person text not null,
  contact_phone varchar(20) not null,
  contact_email text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode varchar(10) not null,
  gstin text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Customers / Consignees
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text,
  phone varchar(20) not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode varchar(10) not null,
  country text not null default 'India',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Courier Providers (Master reference list)
create table if not exists public.courier_providers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  supports_cod boolean not null default true,
  supports_prepaid boolean not null default true,
  supports_reverse_pickup boolean not null default true,
  config_schema jsonb default '{}'::jsonb,
  tracking_url_template text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Courier Accounts (Merchant's custom or Aggregator master credentials placeholder)
create table if not exists public.courier_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  courier_provider_id uuid not null references public.courier_providers(id) on delete cascade,
  account_name text not null,
  is_aggregated boolean not null default true,
  is_active boolean not null default true,
  credentials_placeholder jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Courier Rates (Zone & Weight Slabs)
create table if not exists public.courier_rates (
  id uuid primary key default gen_random_uuid(),
  courier_provider_id uuid not null references public.courier_providers(id) on delete cascade,
  zone public.shipping_zone not null,
  min_weight_kg numeric(8,3) not null default 0.500,
  additional_weight_slab_kg numeric(8,3) not null default 0.500,
  forward_base_rate numeric(10,2) not null check (forward_base_rate >= 0),
  forward_additional_rate numeric(10,2) not null check (forward_additional_rate >= 0),
  cod_fixed_charge numeric(10,2) not null default 40.00 check (cod_fixed_charge >= 0),
  cod_percentage numeric(5,2) not null default 2.00 check (cod_percentage >= 0),
  rto_rate numeric(10,2) not null check (rto_rate >= 0),
  reverse_rate numeric(10,2) not null check (reverse_rate >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (courier_provider_id, zone, min_weight_kg)
);

-- 10. Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_number text not null,
  channel_order_id text,
  channel_name text not null default 'MANUAL',
  customer_id uuid not null references public.customers(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  payment_mode public.payment_mode not null default 'PREPAID',
  order_amount numeric(14,2) not null check (order_amount >= 0),
  cod_amount numeric(14,2) not null default 0 check (cod_amount >= 0),
  order_status public.order_status not null default 'DRAFT',
  total_weight_kg numeric(8,3) not null default 0.500 check (total_weight_kg > 0),
  length_cm numeric(8,2) not null default 10.00 check (length_cm > 0),
  width_cm numeric(8,2) not null default 10.00 check (width_cm > 0),
  height_cm numeric(8,2) not null default 10.00 check (height_cm > 0),
  volumetric_weight_kg numeric(8,3) generated always as (round((length_cm * width_cm * height_cm) / 5000.0, 3)) stored,
  chargeable_weight_kg numeric(8,3) not null default 0.500 check (chargeable_weight_kg > 0),
  invoice_number text,
  invoice_date date,
  eway_bill_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, order_number)
);

-- 11. Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_name text not null,
  sku text,
  hsn_code varchar(20),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  tax_rate numeric(5,2) not null default 18.00 check (tax_rate >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  weight_grams integer not null default 500 check (weight_grams > 0),
  created_at timestamptz not null default now()
);

-- 12. E-Commerce Shipments
create table if not exists public.ecommerce_shipments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  courier_provider_id uuid not null references public.courier_providers(id) on delete restrict,
  courier_account_id uuid references public.courier_accounts(id) on delete set null,
  awb_number text not null,
  tracking_number text,
  shipment_status public.ecommerce_shipment_status not null default 'MANIFESTED',
  pickup_pincode varchar(10) not null,
  delivery_pincode varchar(10) not null,
  payment_mode public.payment_mode not null default 'PREPAID',
  cod_amount numeric(14,2) not null default 0 check (cod_amount >= 0),
  declared_value numeric(14,2) not null check (declared_value >= 0),
  weight_kg numeric(8,3) not null check (weight_kg > 0),
  length_cm numeric(8,2) not null check (length_cm > 0),
  width_cm numeric(8,2) not null check (width_cm > 0),
  height_cm numeric(8,2) not null check (height_cm > 0),
  volumetric_weight_kg numeric(8,3) generated always as (round((length_cm * width_cm * height_cm) / 5000.0, 3)) stored,
  chargeable_weight_kg numeric(8,3) not null check (chargeable_weight_kg > 0),
  shipping_charge numeric(12,2) not null check (shipping_charge >= 0),
  courier_charge numeric(12,2) not null check (courier_charge >= 0),
  seller_margin numeric(12,2) generated always as (shipping_charge - courier_charge) stored,
  pickup_scheduled_date date,
  estimated_delivery_date date,
  actual_delivery_date timestamptz,
  label_url text,
  manifest_url text,
  routing_code text,
  tracking_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, awb_number)
);

-- 13. Tracking Events (Detailed Courier Checkpoints)
create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.ecommerce_shipments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.ecommerce_shipment_status not null,
  activity text not null,
  location text,
  scan_datetime timestamptz not null default now(),
  courier_status_code text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- 14. NDR Cases (Non-Delivery Reports)
create table if not exists public.ndr_cases (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.ecommerce_shipments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number integer not null default 1,
  reason_code text not null,
  reason_description text not null,
  ndr_status public.ndr_status not null default 'OPEN',
  customer_action text,
  reattempt_date date,
  remark text,
  escalated_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. RTO Shipments (Return to Origin)
create table if not exists public.rto_shipments (
  id uuid primary key default gen_random_uuid(),
  original_shipment_id uuid not null references public.ecommerce_shipments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rto_awb_number text,
  reason text not null,
  rto_status public.rto_status not null default 'INITIATED',
  initiated_at timestamptz not null default now(),
  delivered_at timestamptz,
  rto_shipping_charge numeric(12,2) not null default 0 check (rto_shipping_charge >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16. Return Shipments (Customer Reverse Pickups)
create table if not exists public.return_shipments (
  id uuid primary key default gen_random_uuid(),
  original_order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  courier_provider_id uuid not null references public.courier_providers(id) on delete restrict,
  return_awb_number text,
  return_reason text not null,
  return_status public.return_status not null default 'REQUESTED',
  quality_check_status text default 'PENDING',
  refund_amount numeric(14,2) default 0 check (refund_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 17. COD Settlements (Merchant Remittances)
create table if not exists public.cod_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  settlement_reference text not null unique,
  total_cod_collected numeric(14,2) not null check (total_cod_collected >= 0),
  courier_deductions numeric(14,2) not null default 0 check (courier_deductions >= 0),
  net_settlement_amount numeric(14,2) not null check (net_settlement_amount >= 0),
  settlement_status public.settlement_status not null default 'PENDING',
  remitted_at timestamptz,
  bank_utr text,
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18. Wallet Transactions (Prepaid Ledger)
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_type public.wallet_txn_type not null,
  category public.wallet_txn_category not null,
  amount numeric(14,2) not null check (amount > 0),
  balance_after numeric(14,2) not null,
  reference_id text,
  description text not null,
  payment_gateway_reference text,
  created_at timestamptz not null default now()
);

-- 19. Webhook Events (Ingestion & Idempotency)
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- 20. Triggers for updated_at
drop trigger if exists seller_accounts_updated on public.seller_accounts;
create trigger seller_accounts_updated before update on public.seller_accounts for each row execute function public.set_updated_at();

drop trigger if exists warehouses_updated on public.warehouses;
create trigger warehouses_updated before update on public.warehouses for each row execute function public.set_updated_at();

drop trigger if exists customers_updated on public.customers;
create trigger customers_updated before update on public.customers for each row execute function public.set_updated_at();

drop trigger if exists courier_providers_updated on public.courier_providers;
create trigger courier_providers_updated before update on public.courier_providers for each row execute function public.set_updated_at();

drop trigger if exists courier_accounts_updated on public.courier_accounts;
create trigger courier_accounts_updated before update on public.courier_accounts for each row execute function public.set_updated_at();

drop trigger if exists courier_rates_updated on public.courier_rates;
create trigger courier_rates_updated before update on public.courier_rates for each row execute function public.set_updated_at();

drop trigger if exists orders_updated on public.orders;
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists ecommerce_shipments_updated on public.ecommerce_shipments;
create trigger ecommerce_shipments_updated before update on public.ecommerce_shipments for each row execute function public.set_updated_at();

drop trigger if exists ndr_cases_updated on public.ndr_cases;
create trigger ndr_cases_updated before update on public.ndr_cases for each row execute function public.set_updated_at();

drop trigger if exists rto_shipments_updated on public.rto_shipments;
create trigger rto_shipments_updated before update on public.rto_shipments for each row execute function public.set_updated_at();

drop trigger if exists return_shipments_updated on public.return_shipments;
create trigger return_shipments_updated before update on public.return_shipments for each row execute function public.set_updated_at();

drop trigger if exists cod_settlements_updated on public.cod_settlements;
create trigger cod_settlements_updated before update on public.cod_settlements for each row execute function public.set_updated_at();

-- 21. Indexes for Fast Lookups
create index if not exists warehouses_user_idx on public.warehouses(user_id);
create index if not exists customers_user_idx on public.customers(user_id);
create index if not exists customers_phone_idx on public.customers(user_id, phone);
create index if not exists orders_user_status_idx on public.orders(user_id, order_status);
create index if not exists orders_created_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists ecommerce_shipments_user_status_idx on public.ecommerce_shipments(user_id, shipment_status);
create index if not exists ecommerce_shipments_awb_idx on public.ecommerce_shipments(awb_number);
create index if not exists ecommerce_shipments_order_idx on public.ecommerce_shipments(order_id);
create index if not exists tracking_events_shipment_idx on public.tracking_events(shipment_id, scan_datetime desc);
create index if not exists ndr_cases_user_status_idx on public.ndr_cases(user_id, ndr_status);
create index if not exists rto_shipments_user_idx on public.rto_shipments(user_id, rto_status);
create index if not exists return_shipments_user_idx on public.return_shipments(user_id, return_status);
create index if not exists cod_settlements_user_idx on public.cod_settlements(user_id, settlement_status);
create index if not exists wallet_transactions_user_idx on public.wallet_transactions(user_id, created_at desc);
create index if not exists courier_rates_lookup_idx on public.courier_rates(courier_provider_id, zone, min_weight_kg);

-- 22. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.seller_accounts enable row level security;
alter table public.warehouses enable row level security;
alter table public.customers enable row level security;
alter table public.courier_providers enable row level security;
alter table public.courier_accounts enable row level security;
alter table public.courier_rates enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.ecommerce_shipments enable row level security;
alter table public.tracking_events enable row level security;
alter table public.ndr_cases enable row level security;
alter table public.rto_shipments enable row level security;
alter table public.return_shipments enable row level security;
alter table public.cod_settlements enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.webhook_events enable row level security;

-- Policies
drop policy if exists "profiles own rows" on public.profiles;
create policy "profiles own rows" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "seller_accounts own rows" on public.seller_accounts;
create policy "seller_accounts own rows" on public.seller_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "warehouses own rows" on public.warehouses;
create policy "warehouses own rows" on public.warehouses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "customers own rows" on public.customers;
create policy "customers own rows" on public.customers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "courier_providers public read" on public.courier_providers;
create policy "courier_providers public read" on public.courier_providers for select using (true);

drop policy if exists "courier_rates public read" on public.courier_rates;
create policy "courier_rates public read" on public.courier_rates for select using (true);

drop policy if exists "courier_accounts own or platform" on public.courier_accounts;
create policy "courier_accounts own or platform" on public.courier_accounts for select using (user_id is null or auth.uid() = user_id);

drop policy if exists "orders own rows" on public.orders;
create policy "orders own rows" on public.orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "order_items own rows" on public.order_items;
create policy "order_items own rows" on public.order_items for all using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
) with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

drop policy if exists "ecommerce_shipments own rows" on public.ecommerce_shipments;
create policy "ecommerce_shipments own rows" on public.ecommerce_shipments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tracking_events own rows" on public.tracking_events;
create policy "tracking_events own rows" on public.tracking_events for select using (auth.uid() = user_id);

drop policy if exists "ndr_cases own rows" on public.ndr_cases;
create policy "ndr_cases own rows" on public.ndr_cases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "rto_shipments own rows" on public.rto_shipments;
create policy "rto_shipments own rows" on public.rto_shipments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "return_shipments own rows" on public.return_shipments;
create policy "return_shipments own rows" on public.return_shipments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cod_settlements own rows" on public.cod_settlements;
create policy "cod_settlements own rows" on public.cod_settlements for select using (auth.uid() = user_id);

drop policy if exists "wallet_transactions own rows" on public.wallet_transactions;
create policy "wallet_transactions own rows" on public.wallet_transactions for select using (auth.uid() = user_id);

-- 23. Grants to Authenticated Role
grant select, update on table public.profiles to authenticated;
grant select, update on table public.seller_accounts to authenticated;
grant select, insert, update, delete on table public.warehouses to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select on table public.courier_providers to authenticated;
grant select on table public.courier_accounts to authenticated;
grant select on table public.courier_rates to authenticated;
grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant select, insert, update, delete on table public.ecommerce_shipments to authenticated;
grant select on table public.tracking_events to authenticated;
grant select, update on table public.ndr_cases to authenticated;
grant select, update on table public.rto_shipments to authenticated;
grant select, insert, update on table public.return_shipments to authenticated;
grant select on table public.cod_settlements to authenticated;
grant select on table public.wallet_transactions to authenticated;

-- 24. Seed default Indian Courier Providers
insert into public.courier_providers (code, name, is_active, supports_cod, supports_prepaid, supports_reverse_pickup, tracking_url_template, logo_url)
values
  ('delhivery', 'Delhivery Express', true, true, true, true, 'https://www.delhivery.com/track/package/{awb}', '/couriers/delhivery.svg'),
  ('bluedart', 'Blue Dart Express', true, true, true, false, 'https://www.bluedart.com/tracking/{awb}', '/couriers/bluedart.svg'),
  ('xpressbees', 'Xpressbees B2C', true, true, true, true, 'https://www.xpressbees.com/track/{awb}', '/couriers/xpressbees.svg'),
  ('ekart', 'Ekart Logistics', true, true, true, true, 'https://ekartlogistics.com/track/{awb}', '/couriers/ekart.svg'),
  ('shadowfax', 'Shadowfax Forward', true, true, true, true, 'https://tracker.shadowfax.in/{awb}', '/couriers/shadowfax.svg'),
  ('dtdc', 'DTDC Express', true, true, true, false, 'https://www.dtdc.in/tracking/{awb}', '/couriers/dtdc.svg')
on conflict (code) do nothing;
