-- Tabell för att lägga till fler arrangörer utöver skaparen (created_by) av en tävling.
-- Skaparen har alltid redigeringsrätt; här kan man bjuda in deltagare som också får redigera tävlingen.

CREATE TABLE IF NOT EXISTS competition_organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

CREATE INDEX IF NOT EXISTS competition_organizers_competition_id_idx ON competition_organizers(competition_id);
CREATE INDEX IF NOT EXISTS competition_organizers_user_id_idx ON competition_organizers(user_id);

ALTER TABLE competition_organizers ENABLE ROW LEVEL SECURITY;

-- Alla autentiserade får läsa vilka som är arrangörer (för att visa i UI).
CREATE POLICY "competition_organizers_select"
  ON competition_organizers FOR SELECT
  TO authenticated
  USING (true);

-- Endast skaparen av tävlingen eller befintliga arrangörer får lägga till/ta bort arrangörer.
-- (API:en kontrollerar även att användaren är creator eller organizer innan anrop.)
CREATE POLICY "competition_organizers_insert"
  ON competition_organizers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_id AND c.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM competition_organizers co
      WHERE co.competition_id = competition_organizers.competition_id AND co.user_id = auth.uid()
    )
  );

CREATE POLICY "competition_organizers_delete"
  ON competition_organizers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_id AND c.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM competition_organizers co
      WHERE co.competition_id = competition_organizers.competition_id AND co.user_id = auth.uid()
    )
  );

COMMENT ON TABLE competition_organizers IS 'Användare som är inbjudna som arrangörer (utöver skaparen created_by).';
