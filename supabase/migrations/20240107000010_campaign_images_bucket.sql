-- Create a bucket for campaign images
insert into storage.buckets (id, name, public)
values ('campaign-images', 'campaign-images', true)
on conflict (id) do nothing;

-- Set up access control for campaign-images
-- 1. Allow public to view images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'campaign-images' );

-- 2. Allow students to upload their own images
create policy "Student Upload"
on storage.objects for insert
with check (
  bucket_id = 'campaign-images' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Allow students to update/delete their own images
create policy "Student Manage"
on storage.objects for update
using (
  bucket_id = 'campaign-images' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Student Delete"
on storage.objects for delete
using (
  bucket_id = 'campaign-images' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);
