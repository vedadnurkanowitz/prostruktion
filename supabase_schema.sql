-- =============================================
-- PROJECTS DATABASE SCHEMA
-- =============================================

-- 0. Customers (Customer Information)
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_number text unique,
  name text,
  email text,
  phone text,
  address text
);

-- 1. Projects (Main Project Table)
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  address text,
  description text,
  contract_value numeric default 0,
  status text default 'Scheduled', -- 'Scheduled', 'In Progress', 'In Abnahme', 'Finished', 'Invoiced'
  scheduled_start date,
  actual_start date,
  estimated_hours text,
  indoor_units integer default 0,
  customer_id uuid references public.customers(id),
  partner_id uuid references public.profiles(id),
  broker_id uuid references public.profiles(id),
  contractor_id uuid references public.contacts(id),
  subcontractor_id uuid references public.contacts(id)
);

-- 2. Project Work Types (Junction Table)
create table if not exists public.project_work_types (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  work_type_key text not null, -- 'montage', 'hydraulik', etc.
  price numeric default 0
);

-- 3. Project Additional Services (Junction Table)
create table if not exists public.project_additional_services (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  service_id text not null, -- 'oeltank', 'spuelung', etc.
  price numeric default 0
);

-- 4. Project Workers (Junction Table)
create table if not exists public.project_workers (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  worker_id uuid references public.contacts(id) not null
);

-- Create updated_at trigger for projects
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger on_projects_updated
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- =============================================
-- EXISTING TABLES (Below)
-- =============================================

-- 1. Contacts (For entities without login access like Subcontractors)
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  company_name text,
  role text not null, -- 'subcontractor', 'contractor', etc.
  email text,
  phone text,
  address text,
  status text default 'Active',
  mediator_id uuid references public.profiles(id), -- Linked Mediator if applicable
  metrics jsonb default '{}'::jsonb -- For storing success rates, etc.
);

-- 2. Invoices (Financials)
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  invoice_number text, -- e.g. INV-1001
  partner_name text,
  amount numeric,
  status text default 'Unpaid', -- 'Unpaid', 'Received', 'Sent'
  date date,
  due_date date,
  items jsonb default '[]'::jsonb, -- Store line items or project references
  is_side_project boolean default false
);

-- 3. Expenses
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  amount numeric not null,
  date date,
  status text default 'Unpaid',
  type text default 'Fixed'
);

-- 4. Todos
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  text text not null,
  status text default 'todo', -- 'todo', 'in-progress', 'done', 'blocked'
  priority text default 'medium',
  due_date date,
  assignee_id uuid references public.profiles(id)
);

-- 5. Complaints
create table if not exists public.complaints (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references public.projects(id),
  subcontractor_id uuid, -- Can reference profiles or contacts
  description text,
  status text default 'Open',
  severity text default 'Low'
);

-- Enable RLS (Optional but recommended, kept open for MVP)
alter table public.customers enable row level security;
alter table public.projects enable row level security;
alter table public.project_work_types enable row level security;
alter table public.project_additional_services enable row level security;
alter table public.project_workers enable row level security;
alter table public.contacts enable row level security;
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;
alter table public.todos enable row level security;
alter table public.complaints enable row level security;

-- Policies (Open for now for Admin convenience)
create policy "Enable all access for authenticated users" on public.customers for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.projects for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.project_work_types for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.project_additional_services for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.project_workers for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.contacts for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.invoices for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.expenses for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.todos for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.complaints for all using (auth.role() = 'authenticated');
