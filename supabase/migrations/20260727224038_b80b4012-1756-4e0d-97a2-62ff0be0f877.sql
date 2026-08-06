DROP POLICY IF EXISTS "Anyone can submit a diagram" ON public.diagram_submissions;

CREATE POLICY "Anyone can submit a diagram"
ON public.diagram_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (name IS NULL OR char_length(name) <= 200)
  AND (email IS NULL OR char_length(email) <= 320)
  AND jsonb_typeof(current_diagram) = 'array'
  AND jsonb_typeof(ideal_diagram) = 'array'
);