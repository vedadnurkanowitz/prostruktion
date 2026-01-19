-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create User Role Enum
create type user_role as enum ('super_admin', 'partner', 'broker');

-- 2. Create Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role user_role not null default 'broker',
  full_name text,
  assigned_partner_id uuid references public.profiles(id), -- For Brokers assigned to a Partner
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Deals Table
create table public.deals (
  id uuid default uuid_generate_v4() primary key,
  broker_id uuid references public.profiles(id) not null,
  title text not null,
  amount numeric(10, 2) not null,
  status text not null default 'pending', -- pending, approved, paid
  commission numeric(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Audit Logs Table
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.deals enable row level security;
alter table public.audit_logs enable row level security;

-- 6. RLS Policies

-- Profiles Policies
create policy "Super Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "Partners can view themselves and their assigned brokers"
  on public.profiles for select
  using (
    auth.uid() = id -- View own profile
    or 
    assigned_partner_id = auth.uid() -- View assigned brokers
  );

create policy "Brokers can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- Deals Policies
create policy "Super Admins can view all deals"
  on public.deals for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "Partners can view deals of their assigned brokers"
  on public.deals for select
  using (
    exists (
      select 1 from public.profiles
      where id = public.deals.broker_id
      and assigned_partner_id = auth.uid()
    )
  );

create policy "Brokers can view own deals"
  on public.deals for select
  using ( broker_id = auth.uid() );

-- Deals Insert/Update Policies (Simplified for MVP)
create policy "Brokers can insert own deals"
  on public.deals for insert
  with check ( broker_id = auth.uid() );

-- Helper function to handle new user creation in public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'broker', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
