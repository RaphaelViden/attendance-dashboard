-- TAPPRESENSI RFID fullstack schema for Supabase.
-- Run this in Supabase SQL Editor when using persistent cloud database.

create type public.employee_division as enum ('Casier', 'Kitchen', 'Produksi', 'Part-time');
create type public.shift_name as enum ('Pagi', 'Siang', 'Middle', 'Middle Closing', 'Pagi Middle', 'Fullday');
create type public.attendance_status as enum ('present', 'late', 'absent', 'leave', 'sick', 'wfh', 'incomplete');
create type public.attendance_source as enum ('rfid', 'manual', 'sync', 'device-mock');

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  division public.employee_division not null,
  shift public.shift_name not null default 'Pagi',
  email text not null default '',
  phone text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rfid_cards (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  rfid_uid text not null unique,
  is_active boolean not null default true,
  registered_at timestamptz not null default now()
);

create table if not exists public.devices (
  id text primary key,
  name text not null,
  location text not null default 'Kantor Utama',
  is_active boolean not null default true,
  last_seen timestamptz,
  power_mode text default 'AC',
  battery_percent int default 100,
  pending_queue int default 0
);

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  rfid_uid text,
  attendance_date date not null default current_date,
  check_in time,
  break_start time,
  break_end time,
  check_out time,
  status public.attendance_status not null default 'incomplete',
  source public.attendance_source not null default 'rfid',
  device_id text references public.devices(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, attendance_date)
);

create table if not exists public.attendance_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_table text not null default 'system',
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;
alter table public.rfid_cards enable row level security;
alter table public.devices enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.attendance_audit_logs enable row level security;

-- This application uses SUPABASE_SERVICE_ROLE_KEY from server-side API routes.
-- Server-side requests bypass RLS; browser never receives the service role key.

insert into public.devices (id, name, location, last_seen, power_mode, battery_percent, pending_queue)
values ('attendance-esp32-001', 'Main Entrance Reader', 'Kantor Utama', now(), 'AC', 92, 0)
on conflict (id) do nothing;
