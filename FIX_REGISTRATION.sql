-- ==============================================================================
-- CRITICAL FIX V2: ROBUST TRIGGER & RPC
-- ==============================================================================
-- This script proactively prevents registration failures by making the 
-- automatic profile creation trigger "soft-fail". If it fails, the user
-- is still created, and the frontend RPC will handle the profile creation.

-- 1. Drop existing trigger to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create a robust trigger function that suppresses errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- Wrap in a nested block to catch errors
  BEGIN
    -- Get role from metadata or default to student
    user_role := (new.raw_user_meta_data->>'role')::public.user_role;
    IF user_role IS NULL THEN
      user_role := 'student';
    END IF;

    -- Try to insert profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, user_role)
    ON CONFLICT (id) DO NOTHING;
    
  EXCEPTION WHEN OTHERS THEN
    -- If anything goes wrong (e.g. constraints, permissions), 
    -- internal logging (RAISE NOTICE) but DO NOT FAIL the transaction.
    -- This ensures auth.users entry remains committed.
    RAISE WARNING 'handle_new_user trigger failed: %', SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 4. Ensure RPC functions are robust and have access to auth schema
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
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Ensure profile exists (Idempotent)
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
