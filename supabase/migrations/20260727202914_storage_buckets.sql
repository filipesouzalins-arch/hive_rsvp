insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('event-assets',   'event-assets',   true,  5242880,  array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('invite-uploads', 'invite-uploads', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']);

-- event-assets: leitura pública, escrita admin
create policy "leitura publica event-assets" on storage.objects
  for select to anon, authenticated using (bucket_id = 'event-assets');
create policy "admin escreve event-assets" on storage.objects
  for insert to authenticated with check (bucket_id = 'event-assets');
create policy "admin atualiza event-assets" on storage.objects
  for update to authenticated using (bucket_id = 'event-assets');
create policy "admin exclui event-assets" on storage.objects
  for delete to authenticated using (bucket_id = 'event-assets');

-- invite-uploads (futura IA): privado, somente admin nesta fase
create policy "admin le invite-uploads" on storage.objects
  for select to authenticated using (bucket_id = 'invite-uploads');
create policy "admin escreve invite-uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'invite-uploads');
create policy "admin exclui invite-uploads" on storage.objects
  for delete to authenticated using (bucket_id = 'invite-uploads');
