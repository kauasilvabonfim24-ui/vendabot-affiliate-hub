drop policy if exists "qualquer um ve as imagens de produto" on storage.objects;
create policy "usuario ve suas proprias imagens de produto" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);