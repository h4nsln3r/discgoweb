-- Märke på disc (t.ex. Innova, Discmania)
-- Kör i Supabase SQL Editor.

alter table public.discs
  add column if not exists brand text;

comment on column public.discs.brand is 'Märke på discen (t.ex. Innova, Discmania)';
