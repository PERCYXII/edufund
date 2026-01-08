-- Allow NULL values in students table for deferred profile completion
ALTER TABLE public.students 
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN university_id DROP NOT NULL,
  ALTER COLUMN student_number DROP NOT NULL,
  ALTER COLUMN course DROP NOT NULL,
  ALTER COLUMN year_of_study DROP NOT NULL;

-- Update the create_student_profile function to handle NULLs
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
SET search_path = public
AS $$
BEGIN
  -- First ensure profile exists
  INSERT INTO public.profiles (id, email, role)
  VALUES (p_id, COALESCE(p_email, ''), 'student')
  ON CONFLICT (id) DO NOTHING;

  -- Then create student record
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

-- Create a function for students to update their own profile
CREATE OR REPLACE FUNCTION public.update_student_profile(
  p_phone TEXT DEFAULT NULL,
  p_university_id TEXT DEFAULT NULL,
  p_student_number TEXT DEFAULT NULL,
  p_course TEXT DEFAULT NULL,
  p_year_of_study TEXT DEFAULT NULL,
  p_field_of_study TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_expected_graduation DATE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.students
  SET 
    phone = COALESCE(p_phone, phone),
    university_id = COALESCE(p_university_id, university_id),
    student_number = COALESCE(p_student_number, student_number),
    course = COALESCE(p_course, course),
    year_of_study = COALESCE(p_year_of_study, year_of_study),
    field_of_study = COALESCE(p_field_of_study, field_of_study),
    title = COALESCE(p_title, title),
    expected_graduation = COALESCE(p_expected_graduation, expected_graduation),
    updated_at = NOW()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_student_profile TO authenticated;

-- Update donor profile function
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
SET search_path = public
AS $$
BEGIN
  -- First ensure profile exists
  INSERT INTO public.profiles (id, email, role)
  VALUES (p_id, COALESCE(p_email, ''), 'donor')
  ON CONFLICT (id) DO NOTHING;

  -- Then create donor record
  INSERT INTO public.donors (id, first_name, last_name, is_anonymous)
  VALUES (p_id, p_first_name, p_last_name, p_is_anonymous);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_donor_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_donor_profile TO anon;
