-- Rensa all data i apptabellerna (kör i Supabase → SQL Editor).
-- CASCADE gör att refererade tabeller också rensas i rätt ordning.

TRUNCATE TABLE
  public.scores,
  public.competition_courses,
  public.profiles,
  public.competitions,
  public.courses
RESTART IDENTITY CASCADE;

-- Om du också har storage-buckets (t.ex. avatars) kan du rensa dem i Dashboard → Storage.
