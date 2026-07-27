-- Templates: tema reutilizável (futuro: gerado por IA a partir da arte do convite)
create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,58}$'),
  name        text not null check (char_length(name) <= 120),
  description text,
  tokens      jsonb not null default '{}'::jsonb,
  layout      jsonb not null default '{}'::jsonb,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,58}$'),
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  name            text not null check (char_length(name) <= 120),
  starts_at       timestamptz not null,
  template_id     uuid references public.templates(id) on delete set null,
  max_companions  smallint not null default 5 check (max_companions between 0 and 20),
  collect_dietary boolean not null default false,
  content         jsonb not null default '{}'::jsonb,
  owner_id        uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index events_status_idx on public.events (status);

create table public.rsvps (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  status       text not null default 'confirmed' check (status in ('confirmed','declined')),
  full_name    text not null check (char_length(btrim(full_name)) between 3 and 120),
  phone        text not null check (char_length(phone) between 10 and 20),
  phone_digits text generated always as (regexp_replace(phone, '\D', '', 'g')) stored,
  companions   smallint not null default 0 check (companions between 0 and 20),
  dietary      text check (char_length(dietary) <= 300),
  notes        text check (char_length(notes) <= 1000),
  created_at   timestamptz not null default now(),
  constraint rsvps_phone_digits_len check (char_length(phone_digits) between 10 and 13)
);
create index rsvps_event_created_idx on public.rsvps (event_id, created_at desc);
create unique index rsvps_event_phone_uniq on public.rsvps (event_id, phone_digits);

-- Gerações de IA (upload de convite -> contexto -> resposta estruturada)
create table public.invite_generations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid references public.events(id) on delete set null,
  template_id       uuid references public.templates(id) on delete set null,
  source_image_path text not null,
  prompt_context    jsonb,
  response          jsonb,
  model             text,
  status            text not null default 'pending' check (status in ('pending','processing','done','error')),
  error_message     text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

create trigger templates_updated_at before update on public.templates
  for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- Validação server-side do RSVP anônimo
create or replace function public.validate_rsvp()
returns trigger language plpgsql security definer set search_path = public as $$
declare ev record;
begin
  select status, max_companions into ev from public.events where id = new.event_id;
  if ev is null then raise exception 'Evento inexistente.'; end if;
  if ev.status <> 'published' then raise exception 'Evento não está publicado.'; end if;
  if new.companions > ev.max_companions then raise exception 'Número de acompanhantes acima do limite.'; end if;
  return new;
end $$;

create trigger rsvps_validate before insert on public.rsvps
  for each row execute function public.validate_rsvp();
