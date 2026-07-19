-- Storage bucket and RLS policies for content uploads

-- Create the uploads bucket (if it doesn't exist)
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, false, 104857600, null)
on conflict (id) do nothing;

-- Allow anon (public) to upload files to the uploads bucket
create policy "Anon upload files"
on storage.objects
for insert
to anon
with check (bucket_id = 'uploads');

-- Allow anon (public) to view/download files from the uploads bucket
create policy "Anon view files"
on storage.objects
for select
to anon
using (bucket_id = 'uploads');

-- Allow anon to update files (upsert)
create policy "Anon update files"
on storage.objects
for update
to anon
with check (bucket_id = 'uploads');

-- Allow anon to delete files
create policy "Anon delete files"
on storage.objects
for delete
to anon
using (bucket_id = 'uploads');

-- Ensure the content table allows anon to read (already exists, but idempotent)
drop policy if exists "Anon read content for playback" on public.content;
create policy "Anon read content for playback"
on public.content
for select
to anon
using (true);
