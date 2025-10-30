-- Email OTPs temporary store
create table if not exists public.email_otps (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  full_name text,
  account_type text,
  created_at timestamptz not null default now()
);

create index if not exists email_otps_expires_at_idx on public.email_otps (expires_at);
