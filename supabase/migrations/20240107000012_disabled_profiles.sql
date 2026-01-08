-- Create disabled_profiles table for "Recycle Bin" functionality
CREATE TABLE IF NOT EXISTS public.disabled_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT,
    role public.user_role,
    user_data JSONB, -- Stores the student/donor specific data
    disabled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    scheduled_deletion_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '60 days') NOT NULL
);

-- Enable RLS
ALTER TABLE public.disabled_profiles ENABLE ROW LEVEL SECURITY;

-- Only admins can see disabled profiles
CREATE POLICY "Admins can view disabled profiles" ON public.disabled_profiles
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Function to disable/archive a profile
CREATE OR REPLACE FUNCTION public.archive_profile(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_role public.user_role;
    v_email TEXT;
    v_data JSONB;
BEGIN
    -- 1. Get profile info
    SELECT role, email INTO v_role, v_email FROM public.profiles WHERE id = p_user_id;
    
    -- 2. Get role-specific data
    IF v_role = 'student' THEN
        SELECT to_jsonb(s.*) INTO v_data FROM public.students s WHERE s.id = p_user_id;
    ELSIF v_role = 'donor' THEN
        SELECT to_jsonb(d.*) INTO v_data FROM public.donors d WHERE d.id = p_user_id;
    END IF;

    -- 3. Insert into disabled_profiles
    INSERT INTO public.disabled_profiles (user_id, email, role, user_data)
    VALUES (p_user_id, v_email, v_role, v_data);

    -- 4. Delete the profile (this will cascade to students/donors table)
    -- Note: We are NOT deleting from auth.users yet. 
    -- We are deleting from public.profiles so they can no longer access the app.
    DELETE FROM public.profiles WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a profile
CREATE OR REPLACE FUNCTION public.restore_profile(p_disabled_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_role public.user_role;
    v_email TEXT;
    v_data JSONB;
BEGIN
    -- 1. Get archived data
    SELECT user_id, role, email, user_data INTO v_user_id, v_role, v_email, v_data 
    FROM public.disabled_profiles 
    WHERE id = p_disabled_id;

    -- 2. Restore profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_user_id, v_email, v_role);

    -- 3. Restore role-specific data
    IF v_role = 'student' THEN
        INSERT INTO public.students 
        SELECT * FROM jsonb_populate_record(NULL::public.students, v_data);
    ELSIF v_role = 'donor' THEN
        INSERT INTO public.donors 
        SELECT * FROM jsonb_populate_record(NULL::public.donors, v_data);
    END IF;

    -- 4. Delete from archive
    DELETE FROM public.disabled_profiles WHERE id = p_disabled_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Permanent deletion after 60 days can be handled by a scheduled task.
-- For now, we'll provide the logic. In Supabase, this is often done via pg_cron (if available) 
-- or a simple manual query from admin dashboard.
