-- Allow public uploads to the documents bucket for proof of payment
-- We previously restricted this to authenticated users, but guest donations need to upload proofs too.

CREATE POLICY "Public can upload proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');
