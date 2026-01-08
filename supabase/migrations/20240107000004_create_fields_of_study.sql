-- Create fields_of_study table
CREATE TABLE IF NOT EXISTS public.fields_of_study (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.fields_of_study ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (needed for registration form)
CREATE POLICY "Allow public read access" ON public.fields_of_study
    FOR SELECT USING (true);

-- Insert Data
INSERT INTO public.fields_of_study (category, name) VALUES
-- Humanities & Arts
('Humanities & Arts', 'African Studies'),
('Humanities & Arts', 'Communication'),
('Humanities & Arts', 'English'),
('Humanities & Arts', 'History'),
('Humanities & Arts', 'Psychology'),
('Humanities & Arts', 'Social Work'),
('Humanities & Arts', 'Visual Arts'),
('Humanities & Arts', 'Languages'),
('Humanities & Arts', 'Music'),

-- Economic & Management Sciences
('Economic & Management Sciences', 'Accounting'),
('Economic & Management Sciences', 'Finance'),
('Economic & Management Sciences', 'Marketing'),
('Economic & Management Sciences', 'Public Management'),
('Economic & Management Sciences', 'Human Resources'),
('Economic & Management Sciences', 'Business Analytics'),
('Economic & Management Sciences', 'Economics'),

-- Science, Engineering & Technology
('Science, Engineering & Technology', 'Computer Science'),
('Science, Engineering & Technology', 'Cybersecurity'),
('Science, Engineering & Technology', 'Robotics'),
('Science, Engineering & Technology', 'Information Technology'),
('Science, Engineering & Technology', 'Civil Engineering'),
('Science, Engineering & Technology', 'Electrical Engineering'),
('Science, Engineering & Technology', 'Mechanical Engineering'),
('Science, Engineering & Technology', 'Mining Engineering'),
('Science, Engineering & Technology', 'Mathematics'),
('Science, Engineering & Technology', 'Physics'),
('Science, Engineering & Technology', 'Chemistry'),
('Science, Engineering & Technology', 'Biotechnology'),

-- Health Sciences
('Health Sciences', 'Medicine'),
('Health Sciences', 'Nursing'),
('Health Sciences', 'Biomedical Sciences'),
('Health Sciences', 'Physiotherapy'),
('Health Sciences', 'Podiatry'),
('Health Sciences', 'Emergency Care'),
('Health Sciences', 'Health Systems'),

-- Education
('Education', 'Foundation Phase Teaching'),
('Education', 'Senior Phase Teaching'),
('Education', 'FET Teaching'),
('Education', 'Inclusive Education'),
('Education', 'Educational Psychology'),

-- Law
('Law', 'General Law'),
('Law', 'Criminal Justice'),
('Law', 'Legal Studies'),

-- Natural & Agricultural Sciences
('Natural & Agricultural Sciences', 'Agriculture'),
('Natural & Agricultural Sciences', 'Environmental Sciences'),
('Natural & Agricultural Sciences', 'Nature Conservation'),
('Natural & Agricultural Sciences', 'Veterinary Science'),

-- Built Environment
('Built Environment', 'Architecture'),
('Built Environment', 'Urban Planning'),
('Built Environment', 'Property Studies'),
('Built Environment', 'Construction');
