-- Run this in Supabase Dashboard > SQL Editor to create the storage bucket for uploads
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Allow public read access to uploads bucket
create policy "Public read uploads" on storage.objects
  for select using (bucket_id = 'uploads');

-- Allow authenticated users to upload to uploads bucket
create policy "Authenticated upload" on storage.objects
  for insert with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

-- Allow service role full access to uploads bucket
create policy "Service role full access uploads" on storage.objects
  for all using (bucket_id = 'uploads' and auth.role() = 'service_role');