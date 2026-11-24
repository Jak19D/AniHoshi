-- RLS for public catalog metadata and user-owned app data.
-- Refuse to silently retain public AniHoshi buckets with conflicting settings.
-- Existing private buckets are kept as-is; missing ones are created private.
do $$
begin
  if exists (
    select 1 from storage.buckets
    where id in ('anime-episodes', 'manga-chapters', 'anime-covers', 'manga-covers', 'profile-images')
      and public
  ) then
    raise exception 'An AniHoshi media bucket already exists as public. Review and privatize it separately before continuing.';
  end if;
end;
$$;

alter table public.animes enable row level security;
alter table public.mangas enable row level security;
alter table public.anime_seasons enable row level security;
alter table public.anime_episodes enable row level security;
alter table public.manga_chapters enable row level security;
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.ratings enable row level security;
alter table public.rating_summaries enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_history enable row level security;
alter table public.watch_history enable row level security;

grant select on public.animes, public.mangas, public.anime_seasons,
  public.anime_episodes, public.manga_chapters to anon, authenticated;
revoke insert, update, delete on public.animes, public.mangas, public.anime_seasons,
  public.anime_episodes, public.manga_chapters from public, anon, authenticated;

revoke all on public.profiles, public.favorites, public.ratings, public.rating_summaries,
  public.reading_progress, public.reading_history, public.watch_history
  from public, anon, authenticated;
grant select, insert, update, delete on public.profiles, public.favorites,
  public.ratings, public.reading_progress, public.reading_history,
  public.watch_history to authenticated;
grant select on public.rating_summaries to authenticated;

-- Catalog metadata is intentionally readable without a session. This does not
-- make the Storage buckets public; private media reads have separate policies.
drop policy if exists "AniHoshi v1 anime catalog read" on public.animes;
create policy "AniHoshi v1 anime catalog read" on public.animes
  for select to anon, authenticated using (true);
drop policy if exists "AniHoshi v1 manga catalog read" on public.mangas;
create policy "AniHoshi v1 manga catalog read" on public.mangas
  for select to anon, authenticated using (true);
drop policy if exists "AniHoshi v1 anime seasons read" on public.anime_seasons;
create policy "AniHoshi v1 anime seasons read" on public.anime_seasons
  for select to anon, authenticated using (true);
drop policy if exists "AniHoshi v1 anime episodes read" on public.anime_episodes;
create policy "AniHoshi v1 anime episodes read" on public.anime_episodes
  for select to authenticated using (true);
drop policy if exists "AniHoshi v1 anime episodes session guard" on public.anime_episodes;
create policy "AniHoshi v1 anime episodes session guard" on public.anime_episodes
  as restrictive for select to public using ((select auth.uid()) is not null);
drop policy if exists "AniHoshi v1 manga chapters read" on public.manga_chapters;
create policy "AniHoshi v1 manga chapters read" on public.manga_chapters
  for select to authenticated using (true);
drop policy if exists "AniHoshi v1 manga chapters session guard" on public.manga_chapters;
create policy "AniHoshi v1 manga chapters session guard" on public.manga_chapters
  as restrictive for select to public using ((select auth.uid()) is not null);

-- Owner policies plus restrictive guards ensure older permissive policies
-- cannot allow one authenticated user to read or modify another's rows.
drop policy if exists "AniHoshi v1 profile owner access" on public.profiles;
create policy "AniHoshi v1 profile owner access" on public.profiles
  for all to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
drop policy if exists "AniHoshi v1 profile owner guard" on public.profiles;
create policy "AniHoshi v1 profile owner guard" on public.profiles
  as restrictive for all to public
  using ((select auth.uid()) is not null and id = (select auth.uid()))
  with check ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "AniHoshi v1 favorite owner access" on public.favorites;
create policy "AniHoshi v1 favorite owner access" on public.favorites
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "AniHoshi v1 favorite owner guard" on public.favorites;
create policy "AniHoshi v1 favorite owner guard" on public.favorites
  as restrictive for all to public
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "AniHoshi v1 rating owner select" on public.ratings;
create policy "AniHoshi v1 rating owner select" on public.ratings
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "AniHoshi v1 rating owner insert" on public.ratings;
create policy "AniHoshi v1 rating owner insert" on public.ratings
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "AniHoshi v1 rating owner update" on public.ratings;
create policy "AniHoshi v1 rating owner update" on public.ratings
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "AniHoshi v1 rating owner delete" on public.ratings;
create policy "AniHoshi v1 rating owner delete" on public.ratings
  for delete to authenticated using (user_id = (select auth.uid()));
drop policy if exists "AniHoshi v1 rating owner guard" on public.ratings;
create policy "AniHoshi v1 rating owner guard" on public.ratings
  as restrictive for all to public
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "AniHoshi v1 rating summary authenticated read" on public.rating_summaries;
create policy "AniHoshi v1 rating summary authenticated read" on public.rating_summaries
  for select to authenticated using (true);

drop policy if exists "AniHoshi v1 reading progress owner access" on public.reading_progress;
create policy "AniHoshi v1 reading progress owner access" on public.reading_progress
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "AniHoshi v1 reading progress owner guard" on public.reading_progress;
create policy "AniHoshi v1 reading progress owner guard" on public.reading_progress
  as restrictive for all to public
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "AniHoshi v1 reading history owner access" on public.reading_history;
create policy "AniHoshi v1 reading history owner access" on public.reading_history
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "AniHoshi v1 reading history owner guard" on public.reading_history;
create policy "AniHoshi v1 reading history owner guard" on public.reading_history
  as restrictive for all to public
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "AniHoshi v1 watch history owner access" on public.watch_history;
create policy "AniHoshi v1 watch history owner access" on public.watch_history
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "AniHoshi v1 watch history owner guard" on public.watch_history;
create policy "AniHoshi v1 watch history owner guard" on public.watch_history
  as restrictive for all to public
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

insert into storage.buckets (id, name, public)
values
  ('anime-episodes', 'anime-episodes', false),
  ('manga-chapters', 'manga-chapters', false),
  ('anime-covers', 'anime-covers', false),
  ('manga-covers', 'manga-covers', false),
  ('profile-images', 'profile-images', false)
on conflict (id) do nothing;

-- Signing a URL requires SELECT on storage.objects. Require a user session for
-- catalog media, then let the existing native PDF/video consumers use the
-- short-lived URL returned by createSignedUrl.
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

drop policy if exists "AniHoshi v1 catalog media signed read" on storage.objects;
create policy "AniHoshi v1 catalog media signed read" on storage.objects
  for select to authenticated
  using (bucket_id in ('anime-episodes', 'manga-chapters', 'anime-covers', 'manga-covers'));
drop policy if exists "AniHoshi v1 profile media owner access" on storage.objects;
create policy "AniHoshi v1 profile media owner access" on storage.objects
  for all to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Restrictive guards also constrain any permissive Storage policies that may
-- have been installed previously. Catalog media is read-only to app clients;
-- profile files are confined to the authenticated user's UID folder.
drop policy if exists "AniHoshi v1 catalog media session guard" on storage.objects;
create policy "AniHoshi v1 catalog media session guard" on storage.objects
  as restrictive for select to public
  using (
    bucket_id not in ('anime-episodes', 'manga-chapters', 'anime-covers', 'manga-covers')
    or (select auth.uid()) is not null
  );
drop policy if exists "AniHoshi v1 catalog media insert guard" on storage.objects;
create policy "AniHoshi v1 catalog media insert guard" on storage.objects
  as restrictive for insert to public
  with check (bucket_id not in ('anime-episodes', 'manga-chapters', 'anime-covers', 'manga-covers'));
drop policy if exists "AniHoshi v1 catalog media update guard" on storage.objects;
create policy "AniHoshi v1 catalog media update guard" on storage.objects
  as restrictive for update to public
  using (bucket_id not in ('anime-episodes', 'manga-chapters', 'anime-covers', 'manga-covers'))
  with check (bucket_id not in ('anime-episodes', 'manga-chapters', 'anime-covers', 'manga-covers'));
drop policy if exists "AniHoshi v1 catalog media delete guard" on storage.objects;
create policy "AniHoshi v1 catalog media delete guard" on storage.objects
  as restrictive for delete to public
  using (bucket_id not in ('anime-episodes', 'manga-chapters', 'anime-covers', 'manga-covers'));
drop policy if exists "AniHoshi v1 profile media owner guard" on storage.objects;
create policy "AniHoshi v1 profile media owner guard" on storage.objects
  as restrictive for all to public
  using (
    bucket_id <> 'profile-images'
    or ((select auth.uid()) is not null and (storage.foldername(name))[1] = (select auth.uid())::text)
  )
  with check (
    bucket_id <> 'profile-images'
    or ((select auth.uid()) is not null and (storage.foldername(name))[1] = (select auth.uid())::text)
  );
