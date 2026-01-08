-- Allow students to delete their own campaigns
CREATE POLICY "Students can delete own campaigns"
ON "public"."campaigns"
FOR DELETE
TO authenticated
USING (student_id = auth.uid());
