-- Bucket "teams" för laglogga och lagbild (public = alla kan läsa, inloggade kan ladda upp).
INSERT INTO storage.buckets (id, name, public)
VALUES ('teams', 'teams', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Alla får läsa från teams-bucket (public).
DROP POLICY IF EXISTS "teams_public_read" ON storage.objects;
CREATE POLICY "teams_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'teams');

-- Inloggade användare får ladda upp till teams/*.
DROP POLICY IF EXISTS "teams_authenticated_upload" ON storage.objects;
CREATE POLICY "teams_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'teams');

-- Inloggade får uppdatera/ersätta filer i teams (t.ex. upsert av logga/bild).
DROP POLICY IF EXISTS "teams_authenticated_update" ON storage.objects;
CREATE POLICY "teams_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'teams')
WITH CHECK (bucket_id = 'teams');
