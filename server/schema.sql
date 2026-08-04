-- LessGo backend schema (Supabase / Postgres)
-- Run once against the target database. Safe to re-run (uses IF NOT EXISTS).

create table if not exists users (
  id text primary key,
  name text not null,
  school text not null,
  grade text not null,
  auth_provider text not null default 'phone',
  phone text unique,
  email text unique,
  password_hash text,
  invite_code text not null default '',
  avatar text not null default '',
  oauth_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists challenges (
  id text primary key,
  share_code text unique not null,
  creator_id text not null references users(id) on delete cascade,
  creator_name text not null,
  mode text not null,
  category text,
  title text not null,
  goal_minutes int not null,
  period_days int not null,
  start_date date,
  end_date date,
  max_participants int,
  open_enrollment boolean not null default false,
  stake_type text,
  donation_amount int not null default 0,
  donation_period text not null default 'week',
  verify_by_hour int not null default 22,
  app_limits jsonb not null default '[]',
  participants jsonb not null default '[]',
  teams jsonb,
  photo text,
  background text,
  memo text,
  pending_edit jsonb,
  created_at timestamptz not null default now()
);

create table if not exists logs (
  id text primary key,
  type text not null,
  message text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists verifications (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  date date not null,
  used_minutes int not null,
  apps jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create index if not exists idx_challenges_creator on challenges(creator_id);
create index if not exists idx_logs_created_at on logs(created_at desc);
create index if not exists idx_verifications_user on verifications(user_id);
