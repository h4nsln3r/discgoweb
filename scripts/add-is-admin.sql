-- Kör denna SQL i Supabase (SQL Editor) för att lägga till admin-stöd.
-- 1) Lägg till kolumnen is_admin på profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2) Gör någon till admin (byt USER_UUID mot användarens id från auth.users / profiles)
-- UPDATE public.profiles SET is_admin = true WHERE id = 'USER_UUID';

-- 3) RLS: så att admin kan radera/uppdatera andras rader
-- Om du har befintliga policies som bara tillåter ägaren, lägg till admin-villkor
-- eller skapa nya policies. Exempel för scores:
-- (Ta bort gamla DELETE/UPDATE-policies för scores om de finns, sedan:)
-- DELETE på scores – ägare eller admin:
-- CREATE POLICY "scores_delete_owner_or_admin" ON public.scores FOR DELETE
--   USING (
--     user_id = auth.uid()
--     OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
--   );
-- UPDATE på scores – ägare eller admin:
-- CREATE POLICY "scores_update_owner_or_admin" ON public.scores FOR UPDATE
--   USING (
--     user_id = auth.uid()
--     OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
--   );
-- Motsvarande för discs (created_by), courses (created_by), competitions (created_by), teams (created_by)
-- om du vill att admin ska kunna redigera/radera överallt i appen.
