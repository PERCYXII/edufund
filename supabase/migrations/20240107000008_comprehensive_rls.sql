-- =====================================================
-- COMPREHENSIVE RLS POLICIES FOR EDUFUND
-- =====================================================

-- ===================== CAMPAIGNS =====================
-- Students can create their own campaigns
CREATE POLICY "Students can create campaigns" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );

-- Students can update their own campaigns
CREATE POLICY "Students can update own campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Admins can update any campaign
CREATE POLICY "Admins can update campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===================== DONATIONS =====================
-- Donors can view their own donations
CREATE POLICY "Donors can view own donations" ON public.donations
  FOR SELECT TO authenticated
  USING (donor_id = auth.uid() OR guest_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins can view all donations
CREATE POLICY "Admins can view all donations" ON public.donations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Students can view donations to their campaigns
CREATE POLICY "Students can view campaign donations" ON public.donations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = donations.campaign_id AND c.student_id = auth.uid()
    )
  );

-- Admins can update donations (for verification)
CREATE POLICY "Admins can update donations" ON public.donations
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===================== DONORS =====================
-- Donors can read their own record
CREATE POLICY "Donors can read own record" ON public.donors
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins can view all donors
CREATE POLICY "Admins can view all donors" ON public.donors
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===================== VERIFICATION REQUESTS =====================
-- Students can create verification requests
CREATE POLICY "Students can create verification requests" ON public.verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Students can view own verification requests
CREATE POLICY "Students can view own verification requests" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

-- Admins can view all verification requests
CREATE POLICY "Admins can view all verification requests" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update verification requests
CREATE POLICY "Admins can update verification requests" ON public.verification_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===================== NOTIFICATIONS =====================
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- System can create notifications (via service role / triggers)
CREATE POLICY "Service can create notifications" ON public.notifications
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ===================== FUNDING ITEMS =====================
-- Students can manage funding items for their campaigns
CREATE POLICY "Students can create funding items" ON public.funding_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = funding_items.campaign_id AND c.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own funding items" ON public.funding_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = funding_items.campaign_id AND c.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can delete own funding items" ON public.funding_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = funding_items.campaign_id AND c.student_id = auth.uid()
    )
  );

-- ===================== UNIVERSITY APPLICATION FEES =====================
-- Make application fees readable by public
DROP POLICY IF EXISTS "Allow public read access" ON public.university_application_fees;
CREATE POLICY "Public can view application fees" ON public.university_application_fees
  FOR SELECT TO public
  USING (true);

-- ===================== RPC FUNCTIONS =====================

-- Create student profile (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_student_profile(
  p_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_university_id UUID,
  p_student_number TEXT,
  p_course TEXT,
  p_year_of_study TEXT,
  p_field_of_study TEXT,
  p_title TEXT,
  p_expected_graduation DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.students (
    id, first_name, last_name, phone, university_id, 
    student_number, course, year_of_study, field_of_study, 
    title, expected_graduation, verification_status
  )
  VALUES (
    p_id, p_first_name, p_last_name, p_phone, p_university_id,
    p_student_number, p_course, p_year_of_study, p_field_of_study,
    p_title, p_expected_graduation, 'pending'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_student_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_student_profile TO anon;

-- Create donor profile (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_donor_profile(
  p_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_is_anonymous BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.donors (id, first_name, last_name, is_anonymous)
  VALUES (p_id, p_first_name, p_last_name, p_is_anonymous);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_donor_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_donor_profile TO anon;

-- Create verification request (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_verification_request(
  p_student_id UUID,
  p_document_type TEXT,
  p_document_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.verification_requests (student_id, document_type, document_url, status)
  VALUES (p_student_id, p_document_type, p_document_url, 'pending')
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_verification_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_verification_request TO anon;

-- ===================== STORAGE POLICIES =====================
-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to view their own documents
CREATE POLICY "Users can view own uploaded documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
