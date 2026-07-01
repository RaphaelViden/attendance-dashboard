-- Supabase schema for Kantor Presence RFID attendance dashboard.
-- Run this in Supabase SQL Editor.

create type public.app_role as enum ('employee', 'admin');
create type public.attendance_status as enum ('present', 'late', 'absent', 'leave', 'sick', 'wfh');
create type public.attendance_source as enum ('rfid', 'manual', 'sync');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.app_role not null default 'employee',
  created_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  division text not null,
  position text not null,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.rfid_cards (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  rfid_uid text not null unique,
  is_active boolean not null default true,
  registered_at timestamptz not null default now()
);

create table public.devices (
  id text primary key,
  name text not null,
  location text not null,
  device_secret_hash text,
  is_active boolean not null default true,
  last_seen timestamptz,
  power_mode text default 'AC',
  battery_percent int default 100,
  pending_queue int default 0
);

create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  rfid_uid text,
  attendance_date date not null default current_date,
  check_in time,
  check_out time,
  status public.attendance_status not null default 'present',
  source public.attendance_source not null default 'rfid',
  device_id text references public.devices(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.rfid_cards enable row level security;
alter table public.devices enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.attendance_audit_logs enable row level security;

create policy "profiles can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "admins can manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated users can read employees"
on public.employees for select
to authenticated
using (true);

create policy "admins can manage employees"
on public.employees for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated users can read rfid cards"
on public.rfid_cards for select
to authenticated
using (true);

create policy "admins can manage rfid cards"
on public.rfid_cards for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated users can read devices"
on public.devices for select
to authenticated
using (true);

create policy "admins can manage devices"
on public.devices for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated users can read attendance"
on public.attendance_logs for select
to authenticated
using (true);

create policy "admins can manage attendance"
on public.attendance_logs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read audit logs"
on public.attendance_audit_logs for select
to authenticated
using (public.is_admin());

insert into public.devices (id, name, location, last_seen, power_mode, battery_percent, pending_queue)
values ('attendance-esp32-001', 'Main Entrance Reader', 'Kantor Utama', now(), 'AC', 92, 0)
on conflict (id) do nothing;
