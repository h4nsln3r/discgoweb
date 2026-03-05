-- Kör denna SQL i Supabase (SQL Editor) om admins inte kan uppdatera roller
-- eller om "Lämna laget" misslyckas p.g.a. RLS.
--
-- Policyerna använder ENDAST tabellerna teams och profiles (aldrig team_member_roles)
-- för att undvika "infinite recursion detected in policy".
-- "Team-admin" = den som står i teams.created_by (lagets ägare).

-- 1) Ta bort gammal hjälpfunktion (orsakade rekursion).
--    CASCADE tar bort alla policies som använder funktionen, så vi behöver inte DROP POLICY först.
DROP FUNCTION IF EXISTS public.is_team_admin(uuid, uuid) CASCADE;

-- 2) team_member_roles – nya policies utan funktion
--    (DROP IF EXISTS gör att scriptet går att köra flera gånger)

-- SELECT: medlemmar i laget (profiles.team_id) eller lagets ägare (teams.created_by)
DROP POLICY IF EXISTS "team_member_roles_select" ON public.team_member_roles;
CREATE POLICY "team_member_roles_select" ON public.team_member_roles
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND team_id = team_member_roles.team_id)
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_member_roles.team_id AND created_by = auth.uid())
  );

-- INSERT: endast lagets ägare (created_by)
DROP POLICY IF EXISTS "team_member_roles_insert" ON public.team_member_roles;
CREATE POLICY "team_member_roles_insert" ON public.team_member_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND created_by = auth.uid())
  );

-- UPDATE: endast lagets ägare
DROP POLICY IF EXISTS "team_member_roles_update" ON public.team_member_roles;
CREATE POLICY "team_member_roles_update" ON public.team_member_roles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND created_by = auth.uid())
  );

-- DELETE: lagets ägare (ta bort andra) eller användaren själv (lämna laget)
DROP POLICY IF EXISTS "team_member_roles_delete" ON public.team_member_roles;
CREATE POLICY "team_member_roles_delete" ON public.team_member_roles
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND created_by = auth.uid())
    OR user_id = auth.uid()
  );

-- 3) teams: SELECT behövs så att policyerna på team_member_roles kan kolla created_by.
--    Utan detta kan EXISTS (SELECT FROM teams ...) inte köras och rollhantering blockeras.
DROP POLICY IF EXISTS "teams_select_for_members_and_creator" ON public.teams;
CREATE POLICY "teams_select_for_members_and_creator" ON public.teams
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND team_id = teams.id)
  );

-- UPDATE: lagets ägare ska kunna uppdatera (t.ex. created_by vid byte av admin)
DROP POLICY IF EXISTS "teams_update_admin" ON public.teams;
CREATE POLICY "teams_update_admin" ON public.teams
  FOR UPDATE
  USING (
    created_by = auth.uid()
  );

-- 4) profiles: användare ska kunna sätta sin egen team_id till null (lämna laget).
-- Vanligtvis finns redan en policy som tillåter UPDATE på egen rad (WHERE id = auth.uid()).
-- Om inte, lägg till:
-- CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
