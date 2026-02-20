-- Tabell för att spara vilka spelare som bekräftat att de var med i ett resultat.
-- Kör denna i Supabase SQL Editor om tabellen inte finns.

CREATE TABLE IF NOT EXISTS public.score_confirmations (
  score_id uuid NOT NULL REFERENCES public.scores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (score_id, user_id)
);

-- RLS: användare får läsa alla bekräftelser för ett resultat, och lägga till sin egen.
ALTER TABLE public.score_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read score_confirmations"
  ON public.score_confirmations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert own confirmation"
  ON public.score_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
