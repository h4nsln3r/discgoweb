-- Kör denna SQL i Supabase (SQL Editor) så att admin kan redigera och ta bort alla banor.
-- Om du redan har policies som bara tillåter created_by, lägg till dessa (då gäller ÄGARE ELLER ADMIN).

-- DELETE på courses – skaparen eller admin:
CREATE POLICY "courses_delete_creator_or_admin"
  ON public.courses FOR DELETE
  USING (
    created_by = auth.uid()
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- UPDATE på courses – skaparen eller admin:
CREATE POLICY "courses_update_creator_or_admin"
  ON public.courses FOR UPDATE
  USING (
    created_by = auth.uid()
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );
