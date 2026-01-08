-- Fix handle_new_user to be idempotent to prevent race conditions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- Get role from metadata or default to student
  user_role := (new.raw_user_meta_data->>'role')::public.user_role;
  IF user_role IS NULL THEN
    user_role := 'student';
  END IF;

  -- Use ON CONFLICT DO NOTHING to prevent errors if profile already created manually or by race condition
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, user_role)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_student_profile to handle updates and be robust
CREATE OR REPLACE FUNCTION public.create_student_profile(
  p_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_university_id TEXT DEFAULT NULL,
  p_student_number TEXT DEFAULT NULL,
  p_course TEXT DEFAULT NULL,
  p_year_of_study TEXT DEFAULT NULL,
  p_field_of_study TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_expected_graduation DATE DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
-- Include auth schema in search path to ensure foreign key lookups against auth.users works reliably
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Ensure profile exists
  INSERT INTO public.profiles (id, email, role)
  VALUES (p_id, COALESCE(p_email, ''), 'student')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create or Update student record
  INSERT INTO public.students (
    id, first_name, last_name, phone, university_id, 
    student_number, course, year_of_study, field_of_study, 
    title, expected_graduation, verification_status
  )
  VALUES (
    p_id, p_first_name, p_last_name, p_phone, p_university_id,
    p_student_number, p_course, p_year_of_study, p_field_of_study,
    p_title, p_expected_graduation, 'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    university_id = EXCLUDED.university_id,
    student_number = EXCLUDED.student_number,
    course = EXCLUDED.course,
    year_of_study = EXCLUDED.year_of_study,
    field_of_study = EXCLUDED.field_of_study,
    title = EXCLUDED.title,
    expected_graduation = EXCLUDED.expected_graduation,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_student_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_student_profile TO anon;

-- Update create_donor_profile similarly
CREATE OR REPLACE FUNCTION public.create_donor_profile(
  p_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_is_anonymous BOOLEAN DEFAULT FALSE,
  p_email TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Ensure profile exists
  INSERT INTO public.profiles (id, email, role)
  VALUES (p_id, COALESCE(p_email, ''), 'donor')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create or Update donor record
  INSERT INTO public.donors (id, first_name, last_name, is_anonymous)
  VALUES (p_id, p_first_name, p_last_name, p_is_anonymous)
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_anonymous = EXCLUDED.is_anonymous,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_donor_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_donor_profile TO anon;
