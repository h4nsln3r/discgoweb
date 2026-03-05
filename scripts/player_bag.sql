-- Tabell: spelarens "bag" – vilka discar som finns i bagen
-- Kör i Supabase SQL Editor om du inte använder migreringar.

create table if not exists public.player_bag (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  disc_id uuid not null references public.discs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, disc_id)
);

create index if not exists player_bag_user_id_idx on public.player_bag(user_id);
create index if not exists player_bag_disc_id_idx on public.player_bag(disc_id);

alter table public.player_bag enable row level security;

-- Användare får se alla baggar (t.ex. på andras profiler), men bara ändra sin egen
create policy "Anyone can view bags"
  on public.player_bag for select
  using (true);

create policy "Users can insert own bag"
  on public.player_bag for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bag"
  on public.player_bag for delete
  using (auth.uid() = user_id);

comment on table public.player_bag is 'Spelarens bag – discar användaren har lagt till i sin bag.';
