-- Lägg till kolumnen landskap på courses (t.ex. Skåne, Uppland).
-- Kör i Supabase SQL Editor.

alter table public.courses
  add column if not exists landskap text;

comment on column public.courses.landskap is 'Landskap (län/region), t.ex. Skåne, Uppland. Används för sortering på Alla banor.';
