create type public.app_role as enum ('administrator','hrd','supervisor','employee');
create type public.rfid_status as enum ('active','inactive','lost','blocked');
create type public.tap_type as enum ('MASUK','MULAI_ISTIRAHAT','SELESAI_ISTIRAHAT','PULANG','EXTRA_TAP');
create type public.employee_status as enum ('active','inactive','on_leave');
create type public.device_status as enum ('online','offline','maintenance');
create type public.employee_division as enum ('Casier','Kitchen','Produksi','Part-time');
create type public.employee_shift as enum ('Pagi','Siang','Middle','Middle Closing','Pagi Middle','Fullday');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  nip text unique,
  email text,
  phone text,
  department text,
  division public.employee_division not null default 'Produksi',
  shift public.employee_shift not null default 'Pagi',
  join_date date default current_date,
  photo_url text,
  status public.employee_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  status public.device_status not null default 'offline',
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.rfid_cards (
  uid text primary key,
  employee_id uuid references public.profiles(id) on delete set null,
  status public.rfid_status not null default 'active',
  device_id uuid references public.devices(id) on delete set null,
  registered_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_taps (
  id uuid primary key default gen_random_uuid(),
  uid text,
  employee_id uuid references public.profiles(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  tapped_at timestamptz not null default now(),
  tap_type public.tap_type not null default 'MASUK',
  notes text,
  created_at timestamptz not null default now()
);

create index idx_taps_employee_date on public.attendance_taps(employee_id, tapped_at desc);
create index idx_taps_tapped_at on public.attendance_taps(tapped_at desc);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.devices enable row level security;
alter table public.rfid_cards enable row level security;
alter table public.attendance_taps enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('administrator','hrd','supervisor')
  );
$$;

create policy "profile self read" on public.profiles for select to authenticated using (auth.uid() = id or public.is_staff(auth.uid()));
create policy "profile self update" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'administrator') or public.has_role(auth.uid(),'hrd'));
create policy "profile admin insert" on public.profiles for insert to authenticated with check (public.has_role(auth.uid(),'administrator') or public.has_role(auth.uid(),'hrd') or auth.uid() = id);
create policy "profile admin delete" on public.profiles for delete to authenticated using (public.has_role(auth.uid(),'administrator'));

create policy "roles self read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.is_staff(auth.uid()));
create policy "devices read" on public.devices for select to authenticated using (true);

create policy "rfid read" on public.rfid_cards for select to authenticated using (auth.uid() = employee_id or public.is_staff(auth.uid()));
create policy "rfid staff insert" on public.rfid_cards for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "rfid staff update" on public.rfid_cards for update to authenticated using (public.is_staff(auth.uid()));
create policy "rfid staff delete" on public.rfid_cards for delete to authenticated using (public.has_role(auth.uid(),'administrator') or public.has_role(auth.uid(),'hrd'));

create policy "taps read" on public.attendance_taps for select to authenticated using (auth.uid() = employee_id or public.is_staff(auth.uid()));

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger trg_rfid_updated before update on public.rfid_cards
  for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;

  if (select count(*) from public.user_roles) = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'administrator');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'employee');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.devices (name, location, status)
values ('ESP32-ENTRANCE-01', 'Kantor Utama', 'offline')
on conflict (name) do nothing;
