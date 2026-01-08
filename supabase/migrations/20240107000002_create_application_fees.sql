-- Create university_application_fees table
CREATE TABLE IF NOT EXISTS public.university_application_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    university_id TEXT REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    branch_code TEXT,
    reference_format TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.university_application_fees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'university_application_fees' 
        AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access" ON public.university_application_fees
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Insert Application Fee Data
INSERT INTO public.university_application_fees (university_id, bank_name, account_number, branch_code, reference_format)
VALUES
    ('uct', 'Standard Bank', '071503854', '025009', '11196 + Applicant Number'),
    ('up', 'Standard Bank', '012602604', '011545', 'Online Study Application Number'),
    ('unisa', 'FNB', '62799630382', '210554', 'Student No + Space + 5370810030'),
    ('tut', 'ABSA', '040000003', '632005', 'ID Number'),
    ('sun', 'Preferred', 'Online Only', 'N/A', 'Use the "Student Fees" online portal'),
    ('ukzn', 'Standard Bank', '053081072', '045426', 'Student Number'),
    ('nwu', 'ABSA', '4058812912', '632005', 'University-assigned Reference'),
    ('wits', 'Preferred', 'Online Only', 'N/A', 'Pay via the Self-Service Portal');
