-- ==============================================================================
-- CRITICAL FIX V3: ALLOW CLIENT-SIDE PROFILE INSERT & DEBUG TRIGGER
-- ==============================================================================
-- 1. Enable RLS for Profiles but allow authenticated users to INSERT their own row.
-- This is crucial if the database trigger fails and the frontend (AuthContext) 
-- attempts to manually create the profile.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated, anon
USING (true);

-- 2. Grant permissions to ensure no permission denied errors
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. Re-affirm the trigger (it looks correct in V2, but let's ensure permissions)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon; -- sometimes needed if signup is anon

-- 4. Check for any missing profiles for existing users and fix them (Backfill)
DO $$
DECLARE
  missing_user RECORD;
BEGIN
  FOR missing_user IN 
    SELECT u.id, u.email, (u.raw_user_meta_data->>'role') as role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, email, role)
    VALUES (
      missing_user.id, 
      missing_user.email, 
      COALESCE((missing_user.role)::public.user_role, 'student')
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;
