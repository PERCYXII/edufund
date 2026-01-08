-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('campaign-images', 'campaign-images', true),
  ('documents', 'documents', false), -- Sensitive docs
  ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES

-- 1. Avatars (Public)
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- 2. Documents (Private - Verification Proofs)
DROP POLICY IF EXISTS "Students can upload verification documents" ON storage.objects;
CREATE POLICY "Students can upload verification documents" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Students can view their own documents" ON storage.objects;
CREATE POLICY "Students can view their own documents" ON storage.objects 
FOR SELECT USING (bucket_id = 'documents' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
CREATE POLICY "Admins can view all documents" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'documents' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Campaign Images (Public)
DROP POLICY IF EXISTS "Campaign images are publicly accessible" ON storage.objects;
CREATE POLICY "Campaign images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-images');

DROP POLICY IF EXISTS "Authenticated users can upload campaign images" ON storage.objects;
CREATE POLICY "Authenticated users can upload campaign images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');
