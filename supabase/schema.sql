-- newsletter-mcp schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- All access happens server-side with the service-role key, which bypasses RLS.
-- RLS is enabled with no public policies so anon/authenticated clients get nothing.

create extension if not exists "pgcrypto";

-- ── Subscribers ───────────────────────────────────────────────────────────────
create table if not exists public.subscribers (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  status         text not null default 'active'
                   check (status in ('active', 'unsubscribed')),
  daily_enabled  boolean not null default true,
  weekly_enabled boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists subscribers_status_idx on public.subscribers (status);

-- ── Newsletters ───────────────────────────────────────────────────────────────
create table if not exists public.weekly_newsletters (
  id                 uuid primary key default gen_random_uuid(),
  week_start         date not null unique,
  week_end           date,
  status             text not null default 'draft'
                       check (status in ('draft', 'sent')),
  chefs_table_title  text,
  chefs_table_body   text,
  news_items         jsonb not null default '[]'::jsonb,
  recipe_ids         uuid[] not null default '{}',
  cooking_items      jsonb not null default '[]'::jsonb,
  system_prompt      text,
  audience_id        text,
  broadcast_id       text,
  generated_at       timestamptz,
  sent_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists weekly_newsletters_status_idx    on public.weekly_newsletters (status);
create index if not exists weekly_newsletters_week_start_idx on public.weekly_newsletters (week_start desc);

-- ── Saved content (optional: "reading" / "cooking" sections) ──────────────────
create table if not exists public.saved_content (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('reading', 'cooking')),
  title       text not null,
  url         text,
  description text,
  source      text,
  created_at  timestamptz not null default now()
);

create index if not exists saved_content_type_created_idx on public.saved_content (type, created_at desc);

-- ── Email templates (optional: welcome email) ─────────────────────────────────
create table if not exists public.email_templates (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  enabled    boolean not null default false,
  subject    text,
  html       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_templates_type_enabled_idx on public.email_templates (type, enabled);

-- ── Email events (optional: Resend webhook log, powers get_email_stats) ───────
create table if not exists public.email_events (
  id           uuid primary key default gen_random_uuid(),
  event_id     text unique,
  event_type   text not null,
  email_id     text,
  broadcast_id text,
  recipient    text,
  subject      text,
  click_url    text,
  payload      jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists email_events_broadcast_idx on public.email_events (broadcast_id);
create index if not exists email_events_type_idx      on public.email_events (event_type, created_at desc);

-- ── updated_at maintenance ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists subscribers_updated_at on public.subscribers;
create trigger subscribers_updated_at before update on public.subscribers
  for each row execute function public.set_updated_at();

drop trigger if exists weekly_newsletters_updated_at on public.weekly_newsletters;
create trigger weekly_newsletters_updated_at before update on public.weekly_newsletters
  for each row execute function public.set_updated_at();

drop trigger if exists email_templates_updated_at on public.email_templates;
create trigger email_templates_updated_at before update on public.email_templates
  for each row execute function public.set_updated_at();

-- ── Lock down: service-role only ──────────────────────────────────────────────
alter table public.subscribers        enable row level security;
alter table public.weekly_newsletters enable row level security;
alter table public.saved_content      enable row level security;
alter table public.email_templates    enable row level security;
alter table public.email_events       enable row level security;
