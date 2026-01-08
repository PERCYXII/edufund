-- Allow students to update their own campaigns
CREATE POLICY "Students can update own campaigns" 
ON public.campaigns 
FOR UPDATE 
TO authenticated 
USING (student_id = auth.uid());

-- Allow students to insert their own campaigns
CREATE POLICY "Students can create own campaigns" 
ON public.campaigns 
FOR INSERT 
TO authenticated 
WITH CHECK (student_id = auth.uid());

-- Allow students to delete their own campaigns (optional but good practice)
CREATE POLICY "Students can delete own campaigns" 
ON public.campaigns 
FOR DELETE 
TO authenticated 
USING (student_id = auth.uid());
