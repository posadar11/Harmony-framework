
CREATE TABLE public.diagram_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  current_diagram jsonb NOT NULL DEFAULT '[]'::jsonb,
  ideal_diagram jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.diagram_submissions TO anon;
GRANT INSERT ON public.diagram_submissions TO authenticated;
GRANT ALL ON public.diagram_submissions TO service_role;

ALTER TABLE public.diagram_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a diagram"
  ON public.diagram_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
