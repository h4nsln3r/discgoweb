-- Tävlingsbilder: deltagare kan ladda upp bilder kopplade till en tävling.
-- Kör denna migration i Supabase SQL Editor om tabellen inte finns.

create table if not exists public.competition_photos (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_competition_photos_competition_id
  on public.competition_photos(competition_id);

create index if not exists idx_competition_photos_created_at
  on public.competition_photos(created_at desc);

comment on table public.competition_photos is 'Bilder uppladdade av deltagare till en tävling.';

-- RLS: alla kan läsa, endast inloggade som är deltagare (eller skapare) kan lägga till.
alter table public.competition_photos enable row level security;

-- Läsa: alla autentiserade (eller gör bucket public och visa bara vad som finns i tabellen)
create policy "competition_photos_select"
  on public.competition_photos for select
  using (true);

-- Infoga: endast om användaren är deltagare i tävlingen eller skapare av tävlingen
create policy "competition_photos_insert"
  on public.competition_photos for insert
  with check (
    auth.uid() = uploaded_by
    and (
      exists (
        select 1 from public.competition_participants cp
        where cp.competition_id = competition_photos.competition_id and cp.user_id = auth.uid()
      )
      or exists (
        select 1 from public.competitions c
        where c.id = competition_photos.competition_id and c.created_by = auth.uid()
      )
    )
  );

-- Ta bort: endast egen bild
create policy "competition_photos_delete"
  on public.competition_photos for delete
  using (auth.uid() = uploaded_by);
