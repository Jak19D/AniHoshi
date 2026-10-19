-- AniHoshi media catalog. Execute from the Supabase SQL editor after creating
-- the project. Public read access is intentional for catalog metadata only.

create table if not exists public.anime_episodes (
  id text primary key,
  anime_id text not null,
  season_number integer not null default 1,
  number integer not null,
  title text not null,
  duration text,
  video_path text,
  video_url text,
  thumbnail_url text,
  unique (anime_id, season_number, number)
);

create table if not exists public.manga_chapters (
  id text primary key,
  manga_id text not null,
  number numeric not null,
  title text not null,
  pdf_path text,
  pdf_url text,
  pages jsonb,
  unique (manga_id, number)
);

alter table public.anime_episodes enable row level security;
alter table public.manga_chapters enable row level security;

grant select on public.anime_episodes to anon, authenticated;
grant select on public.manga_chapters to anon, authenticated;

drop policy if exists "Catalog episodes are readable" on public.anime_episodes;
create policy "Catalog episodes are readable"
  on public.anime_episodes for select to anon, authenticated using (true);

drop policy if exists "Catalog manga chapters are readable" on public.manga_chapters;
create policy "Catalog manga chapters are readable"
  on public.manga_chapters for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public)
values ('anime-episodes', 'anime-episodes', false), ('manga-chapters', 'manga-chapters', false)
on conflict (id) do nothing;

grant select on storage.objects to anon, authenticated;

drop policy if exists "AniHoshi media can be signed for reading" on storage.objects;
create policy "AniHoshi media can be signed for reading"
  on storage.objects for select to anon, authenticated
  using (bucket_id in ('anime-episodes', 'manga-chapters'));

-- Add rows through the dashboard or an authorized server. Never ship a
-- service_role/secret key in the mobile app. Paths are relative to the bucket.
