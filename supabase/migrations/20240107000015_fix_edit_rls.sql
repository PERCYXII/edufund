-- Ensure funding_items policies are explicit and correct
DROP POLICY IF EXISTS "Students can manage own funding items" ON "public"."funding_items";

CREATE POLICY "Students can insert own funding items"
ON "public"."funding_items"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = funding_items.campaign_id
    AND c.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update own funding items"
ON "public"."funding_items"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = funding_items.campaign_id
    AND c.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = funding_items.campaign_id
    AND c.student_id = auth.uid()
  )
);

CREATE POLICY "Students can delete own funding items"
ON "public"."funding_items"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = funding_items.campaign_id
    AND c.student_id = auth.uid()
  )
);

-- Ensure campaigns update policy is permissive for the student
-- (Assuming the policy created previously might have been just implicit or missing something)
DROP POLICY IF EXISTS "Students can update own campaigns" ON "public"."campaigns";

CREATE POLICY "Students can update own campaigns"
ON "public"."campaigns"
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());
