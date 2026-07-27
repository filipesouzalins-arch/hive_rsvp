alter table public.templates enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.invite_generations enable row level security;

-- EVENTS: anon só lê publicados; admin (authenticated) tudo
create policy "anon le eventos publicados" on public.events
  for select to anon using (status = 'published');
create policy "admin le eventos" on public.events
  for select to authenticated using (true);
create policy "admin insere eventos" on public.events
  for insert to authenticated with check (true);
create policy "admin atualiza eventos" on public.events
  for update to authenticated using (true) with check (true);
create policy "admin exclui eventos" on public.events
  for delete to authenticated using (true);

-- RSVPS: NENHUMA policy de select p/ anon; insert restrito
create policy "anon confirma presenca" on public.rsvps
  for insert to anon
  with check (
    status = 'confirmed'
    and exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
  );
create policy "admin le rsvps" on public.rsvps for select to authenticated using (true);
create policy "admin insere rsvps" on public.rsvps for insert to authenticated with check (true);
create policy "admin atualiza rsvps" on public.rsvps for update to authenticated using (true) with check (true);
create policy "admin exclui rsvps" on public.rsvps for delete to authenticated using (true);

-- TEMPLATES: leitura pública; admin gerencia
create policy "leitura publica de templates" on public.templates
  for select to anon, authenticated using (true);
create policy "admin insere templates" on public.templates
  for insert to authenticated with check (true);
create policy "admin atualiza templates" on public.templates
  for update to authenticated using (true) with check (true);
create policy "admin exclui templates" on public.templates
  for delete to authenticated using (true);

-- INVITE_GENERATIONS: somente admin
create policy "admin le geracoes" on public.invite_generations for select to authenticated using (true);
create policy "admin insere geracoes" on public.invite_generations for insert to authenticated with check (true);
create policy "admin atualiza geracoes" on public.invite_generations for update to authenticated using (true) with check (true);
create policy "admin exclui geracoes" on public.invite_generations for delete to authenticated using (true);

-- Realtime: página pública re-renderiza quando admin edita
alter publication supabase_realtime add table public.events;
