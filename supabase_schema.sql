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
alter table public.contacts enable row level security;
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;
alter table public.todos enable row level security;
alter table public.complaints enable row level security;

-- Policies (Open for now for Admin convenience)
create policy "Enable all access for authenticated users" on public.contacts for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.invoices for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.expenses for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.todos for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.complaints for all using (auth.role() = 'authenticated');
