-- Automatically register supported catalog media after Storage uploads.
-- Upload names are strict to prevent associating a file with the wrong title.
-- Anime:  demon-slayer--s01-e001.mp4
-- Manga:  demon-slayer--c001.pdf

create or replace function public.register_catalog_media_upload_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  object_name text;
  object_bucket text;
  parts text[];
  content_slug text;
  content_id text;
  content_title text;
  season_no integer;
  episode_no integer;
  chapter_no integer;
begin
  if tg_op = 'DELETE' then
    object_name := old.name;
    object_bucket := old.bucket_id;
    if object_bucket = 'anime-episodes' then
      update public.anime_episodes set video_path = null where video_path = object_name;
    elsif object_bucket = 'manga-chapters' then
      update public.manga_chapters set pdf_path = null where pdf_path = object_name;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.name is distinct from new.name then
    if old.bucket_id = 'anime-episodes' then
      update public.anime_episodes set video_path = null where video_path = old.name;
    elsif old.bucket_id = 'manga-chapters' then
      update public.manga_chapters set pdf_path = null where pdf_path = old.name;
    end if;
  end if;

  object_name := new.name;
  object_bucket := new.bucket_id;

  if object_bucket = 'anime-episodes' then
    parts := pg_catalog.regexp_match(
      object_name,
      '^([a-z0-9]+(-[a-z0-9]+)*)--s([0-9]{1,2})-e([0-9]{1,3})\.mp4$',
      'i'
    );
    if parts is null then return new; end if;

    content_slug := pg_catalog.lower(parts[1]);
    season_no := parts[3]::integer;
    episode_no := parts[4]::integer;
    content_title := pg_catalog.initcap(pg_catalog.replace(content_slug, '-', ' '));

    select id into content_id
    from public.animes
    where pg_catalog.lower(pg_catalog.regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) = content_slug
    order by id
    limit 1;

    if content_id is null then
      content_id := content_slug;
      insert into public.animes (id, title)
      values (content_id, content_title)
      on conflict (id) do nothing;
    end if;

    insert into public.anime_seasons (anime_id, season_number, title)
    values (content_id, season_no, 'Temporada ' || season_no)
    on conflict (anime_id, season_number) do nothing;

    insert into public.anime_episodes (
      id, anime_id, season_number, number, title, video_path
    ) values (
      content_id || '-s' || pg_catalog.lpad(season_no::text, 2, '0') || '-e' || pg_catalog.lpad(episode_no::text, 3, '0'),
      content_id,
      season_no,
      episode_no,
      'Episódio ' || episode_no,
      object_name
    )
    on conflict (anime_id, season_number, number)
    do update set video_path = excluded.video_path;

    return new;
  end if;

  if object_bucket = 'manga-chapters' then
    parts := pg_catalog.regexp_match(
      object_name,
      '^([a-z0-9]+(-[a-z0-9]+)*)--c([0-9]{1,4})\.pdf$',
      'i'
    );
    if parts is null then return new; end if;

    content_slug := pg_catalog.lower(parts[1]);
    chapter_no := parts[3]::integer;
    content_title := pg_catalog.initcap(pg_catalog.replace(content_slug, '-', ' '));

    select id into content_id
    from public.mangas
    where pg_catalog.lower(pg_catalog.regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) = content_slug
    order by id
    limit 1;

    if content_id is null then
      content_id := content_slug;
      insert into public.mangas (id, title)
      values (content_id, content_title)
      on conflict (id) do nothing;
    end if;

    insert into public.manga_chapters (id, manga_id, number, title, pdf_path)
    values (
      content_id || '-c' || pg_catalog.lpad(chapter_no::text, 4, '0'),
      content_id,
      chapter_no,
      'Capítulo ' || chapter_no,
      object_name
    )
    on conflict (manga_id, number)
    do update set pdf_path = excluded.pdf_path;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists anihoshi_register_media_insert_v1 on storage.objects;
create trigger anihoshi_register_media_insert_v1
  after insert on storage.objects
  for each row
  when (new.bucket_id in ('anime-episodes', 'manga-chapters'))
  execute function public.register_catalog_media_upload_v1();

drop trigger if exists anihoshi_register_media_update_v1 on storage.objects;
create trigger anihoshi_register_media_update_v1
  after update of name, bucket_id on storage.objects
  for each row
  when (new.bucket_id in ('anime-episodes', 'manga-chapters') or old.bucket_id in ('anime-episodes', 'manga-chapters'))
  execute function public.register_catalog_media_upload_v1();

drop trigger if exists anihoshi_register_media_delete_v1 on storage.objects;
create trigger anihoshi_register_media_delete_v1
  after delete on storage.objects
  for each row
  when (old.bucket_id in ('anime-episodes', 'manga-chapters'))
  execute function public.register_catalog_media_upload_v1();

revoke all on function public.register_catalog_media_upload_v1() from public, anon, authenticated;
