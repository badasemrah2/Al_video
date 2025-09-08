-- Supabase schema for video generation jobs
-- Run this in Supabase SQL editor

create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  type text not null,
  prompt text not null,
  negative_prompt text,
  status text not null,
  progress smallint not null default 0,
  result_url text,
  source_image_url text,
  duration_seconds smallint,
  aspect_ratio text,
  error text,
  cost_cents integer,
  user_id uuid,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_created on public.jobs(created_at desc);
create index if not exists idx_jobs_user_status on public.jobs(user_id, status);

create table if not exists public.job_events (
  id bigserial primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null,
  progress smallint not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_events_job_id_created on public.job_events(job_id, created_at);
create index if not exists idx_job_events_status on public.job_events(status);

-- (Optional) Enable RLS AFTER you add auth policies
-- alter table public.jobs enable row level security;
-- alter table public.job_events enable row level security;
-- example policy (open read):
-- create policy "read_all_jobs" on public.jobs for select using (true);
