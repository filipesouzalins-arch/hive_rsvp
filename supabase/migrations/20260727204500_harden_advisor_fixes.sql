-- Funções de trigger não devem ser executáveis via RPC
revoke execute on function public.validate_rsvp() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Bucket público serve objetos por URL sem policy; listagem só para admin
drop policy "leitura publica event-assets" on storage.objects;
create policy "admin le event-assets" on storage.objects
  for select to authenticated using (bucket_id = 'event-assets');
