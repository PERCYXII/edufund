-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;

-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('campaign-images', 'campaign-images', true),
  ('documents', 'documents', false),
  ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Avatars (Public Read, User Upload)
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can update their own avatar." ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Storage Policies: Campaign Images (Public Read, Student Upload)
CREATE POLICY "Campaign images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'campaign-images');

CREATE POLICY "Students can upload campaign images." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

-- Storage Policies: Documents (Private, Student Upload, Admin Read)
-- Authenticated users (Students) can upload
CREATE POLICY "Students can upload verification documents." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Owner can read their own documents
CREATE POLICY "Students can view their own documents." ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Storage Policies: Invoices (Private, Student Upload, Admin Read)
CREATE POLICY "Students can upload invoices." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'authenticated');

CREATE POLICY "Students can view their own invoices." ON storage.objects
  FOR SELECT USING (bucket_id = 'invoices' AND auth.uid() = owner);

-- Helper to allow Admins to view everything (Assuming admin role check function exists or row level security is bypassed for service role)
-- For now, we rely on the app logic or service key for admin viewing of private buckets.
