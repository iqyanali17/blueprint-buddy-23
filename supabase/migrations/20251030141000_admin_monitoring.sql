-- Admin Monitoring System
create table if not exists public.user_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  username text,
  login_time timestamptz not null default now(),
  status text not null check (status in ('logged_in','logged_out')),
  created_at timestamptz not null default now()
);

create index if not exists user_logs_user_id_idx on public.user_logs (user_id);
create index if not exists user_logs_login_time_idx on public.user_logs (login_time);

alter table public.user_logs enable row level security;

create policy if not exists "Users can insert own logs" on public.user_logs
for insert with check (auth.uid()::text = user_id::text);

create policy if not exists "Users can view own logs" on public.user_logs
for select using (auth.uid()::text = user_id::text);

create policy if not exists "Admins can view logs" on public.user_logs
for select using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  username text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_user_id_idx on public.support_messages (user_id);
create index if not exists support_messages_created_at_idx on public.support_messages (created_at);

alter table public.support_messages enable row level security;

create policy if not exists "Users can insert own support messages" on public.support_messages
for insert with check (auth.uid()::text = user_id::text);

create policy if not exists "Users can view own support messages" on public.support_messages
for select using (auth.uid()::text = user_id::text);

create policy if not exists "Admins can view support messages" on public.support_messages
for select using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.user_presence (
  user_id uuid primary key,
  email text,
  username text,
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_presence_online_idx on public.user_presence (is_online);
create index if not exists user_presence_last_seen_idx on public.user_presence (last_seen);

alter table public.user_presence enable row level security;

create policy if not exists "Users can upsert own presence" on public.user_presence
for all using (auth.uid()::text = user_id::text) with check (auth.uid()::text = user_id::text);

create policy if not exists "Admins can view presence" on public.user_presence
for select using (public.has_role(auth.uid(), 'admin'));
