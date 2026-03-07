-- Skaparen av en tävling får ta bort tävlingen och all kopplad data.

-- Ta bort tävling (skaparen eller admin)
create policy "competitions_delete_creator"
  on public.competitions for delete
  using (
    created_by = auth.uid()
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1) = true
  );

-- Ta bort tävlingens banor (skaparen eller admin)
create policy "competition_courses_delete_by_creator"
  on public.competition_courses for delete
  using (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1) = true
    OR exists (
      select 1 from public.competitions c
      where c.id = competition_courses.competition_id and c.created_by = auth.uid()
    )
  );

-- Ta bort deltagare från tävlingen (skaparen eller admin)
create policy "competition_participants_delete_by_creator"
  on public.competition_participants for delete
  using (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1) = true
    OR exists (
      select 1 from public.competitions c
      where c.id = competition_participants.competition_id and c.created_by = auth.uid()
    )
  );

-- Ta bort tävlingsbilder i sin tävling (skaparen eller admin – utöver befintlig "egna bilder"-policy)
create policy "competition_photos_delete_by_competition_creator"
  on public.competition_photos for delete
  using (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1) = true
    OR exists (
      select 1 from public.competitions c
      where c.id = competition_photos.competition_id and c.created_by = auth.uid()
    )
  );

-- Skaparen får nollställa competition_id på resultat (så att tävlingen kan tas bort)
create policy "scores_update_competition_id_by_competition_creator"
  on public.scores for update
  using (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1) = true
    OR exists (
      select 1 from public.competitions c
      where c.id = scores.competition_id and c.created_by = auth.uid()
    )
  )
  with check (true);
