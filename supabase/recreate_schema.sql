-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA: attendees
create table public.attendees (
    id uuid default gen_random_uuid() primary key,
    firstname text not null,
    lastname text not null,
    email text not null,
    phone text not null,
    church text not null,
    sector text not null,
    paymentamount numeric default 0,
    paymentstatus text default 'Pendiente',
    paymentreceipturl text,
    registrationdate timestamp with time zone default now(),
    tshirtsize text,
    receives_tshirt boolean default false,
    attendance_number integer,
    attendance_confirmed boolean default false,
    attendance_confirmed_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    istest boolean default false,
    district text,
    pastor text
);

-- Habilitar RLS (Seguridad a Nivel de Fila)
alter table public.attendees enable row level security;

-- Política: Permitir inserciones públicas (para el formulario de registro)
create policy "Allow public inserts" on public.attendees
  for insert with check (true);

-- Política: Permitir lectura a todos (o restringir solo a admins si prefieres)
create policy "Allow public select" on public.attendees
  for select using (true);
  
-- Política: Permitir actualizaciones a todos
create policy "Allow public updates" on public.attendees
  for update using (true);


-- 3. TABLA: profiles (Roles)
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    role text not null check (role in ('admin', 'editor')),
    created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
create policy "Allow users to read their own profile" on public.profiles
  for select using (auth.uid() = id);

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

create policy "Allow admins to read all profiles" on public.profiles
  for select using (public.is_admin());

-- Trigger para crear profile cuando se registra un usuario en Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'editor'); -- por defecto editor
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 4. TABLA: caja_log
create table public.caja_log (
    id uuid default gen_random_uuid() primary key,
    nombre text not null,
    monto_anterior numeric not null,
    monto_actual numeric not null,
    motivo text not null,
    modificado_por text not null,
    fecha timestamp with time zone default now()
);

alter table public.caja_log enable row level security;
create policy "Allow public read/insert on caja_log" on public.caja_log
  for all using (true);


-- 5. BUCKET DE STORAGE: payment-receipts
insert into storage.buckets (id, name, public) 
values ('payment-receipts', 'payment-receipts', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'payment-receipts' );

create policy "Anon Insert"
  on storage.objects for insert
  with check ( bucket_id = 'payment-receipts' );
