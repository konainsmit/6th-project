create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(), sku text unique not null,
  title text not null, category text not null, unit_price numeric(12,2) not null default 0,
  safety_threshold integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(), name text not null, lead_time_days integer not null default 7,
  webhook_url text, created_at timestamptz not null default now()
);
create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references products(id),
  warehouse text not null, quantity_delta integer not null, reason text, occurred_at timestamptz not null default now()
);
create table if not exists sales_history (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references products(id),
  units_sold integer not null, sold_on date not null, created_at timestamptz not null default now()
);
create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(), supplier_id uuid not null references suppliers(id),
  status text not null default 'draft', items jsonb not null default '[]', total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sales_history_product_date_idx on sales_history(product_id, sold_on desc);
create index if not exists inventory_transactions_product_idx on inventory_transactions(product_id, occurred_at desc);
