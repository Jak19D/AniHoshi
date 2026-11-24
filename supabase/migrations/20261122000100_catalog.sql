-- AniHoshi catalog foundation. Additive migration: existing media tables and rows
-- are retained so mediaRepository can continue querying the same names/columns.

-- Check bucket privacy before any catalog changes are made. A conflicting public
-- bucket requires separate review; this migration never changes public flags.
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

create table if not exists public.animes (
  id text primary key,
  title text not null,
  synopsis text,
  release_year integer,
  genres text[] not null default '{}',
  external_rating numeric(3, 1),
  cover_path text,
  cover_url text,
  banner_path text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mangas (
  id text primary key,
  title text not null,
  synopsis text,
  author text,
  release_year integer,
  genres text[] not null default '{}',
  external_rating numeric(3, 1),
  cover_path text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anime_seasons (
  anime_id text not null references public.animes(id) on delete cascade,
  season_number integer not null,
  title text not null,
  release_year integer,
  primary key (anime_id, season_number)
);

-- Keep these definitions aligned with docs/supabase-media-schema.sql. IF NOT
-- EXISTS makes this safe for projects where that earlier schema was applied.
create table if not exists public.anime_episodes (
  id text primary key,
  anime_id text not null,
  season_number integer not null default 1,
  number integer not null,
  title text not null,
  duration text,
  video_path text,
  video_url text,
  thumbnail_path text,
  thumbnail_url text,
  unique (anime_id, season_number, number)
);

-- The earlier manual schema did not include private thumbnail storage paths.
alter table public.anime_episodes add column if not exists thumbnail_path text;

create table if not exists public.manga_chapters (
  id text primary key,
  manga_id text not null,
  number numeric not null,
  title text not null,
  pdf_path text,
  pdf_url text,
  page_paths text[],
  pages jsonb,
  unique (manga_id, number)
);

-- Preserve legacy public page URLs in pages while adding private Storage paths.
alter table public.manga_chapters add column if not exists page_paths text[];

-- Composite uniqueness lets user reading records prove that a chapter belongs
-- to the manga recorded alongside it (not merely that both IDs exist).
create unique index if not exists manga_chapters_manga_id_id_unique
  on public.manga_chapters (manga_id, id);

-- Fail safely if a pre-existing media table has a conflicting definition.
do $$
declare
  expected record;
  actual_udt text;
begin
  for expected in
    select * from (values
      ('anime_episodes', 'id', 'text'),
      ('anime_episodes', 'anime_id', 'text'),
      ('anime_episodes', 'season_number', 'int4'),
      ('anime_episodes', 'number', 'int4'),
      ('anime_episodes', 'title', 'text'),
      ('anime_episodes', 'duration', 'text'),
      ('anime_episodes', 'video_path', 'text'),
      ('anime_episodes', 'video_url', 'text'),
      ('anime_episodes', 'thumbnail_path', 'text'),
      ('anime_episodes', 'thumbnail_url', 'text'),
      ('manga_chapters', 'id', 'text'),
      ('manga_chapters', 'manga_id', 'text'),
      ('manga_chapters', 'number', 'numeric'),
      ('manga_chapters', 'title', 'text'),
      ('manga_chapters', 'pdf_path', 'text'),
      ('manga_chapters', 'pdf_url', 'text'),
      ('manga_chapters', 'page_paths', '_text'),
      ('manga_chapters', 'pages', 'jsonb')
    ) as expected_columns(table_name, column_name, udt_name)
  loop
    select c.udt_name into actual_udt
      from information_schema.columns as c
      where c.table_schema = 'public'
        and c.table_name = expected.table_name
        and c.column_name = expected.column_name;
    if actual_udt is distinct from expected.udt_name then
      raise exception 'Expected public.%.% to have type %, found %.',
        expected.table_name, expected.column_name, expected.udt_name, actual_udt;
    end if;
  end loop;
end;
$$;

-- Add relationships without rejecting pre-existing orphaned media rows. New
-- rows must reference catalog and season entries. Existing rows can be checked
-- and cleaned up before validating these constraints in a later migration.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anime_episodes'::regclass
      and conname = 'anihoshi_anime_episodes_anime_id_fkey_v1'
  ) then
    alter table public.anime_episodes
      add constraint anihoshi_anime_episodes_anime_id_fkey_v1
      foreign key (anime_id) references public.animes(id) on delete cascade not valid;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.anime_episodes'::regclass
      and conname = 'anihoshi_anime_episodes_season_fkey_v1'
  ) then
    alter table public.anime_episodes
      add constraint anihoshi_anime_episodes_season_fkey_v1
      foreign key (anime_id, season_number)
      references public.anime_seasons(anime_id, season_number) on delete cascade not valid;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.manga_chapters'::regclass
      and conname = 'anihoshi_manga_chapters_manga_id_fkey_v1'
  ) then
    alter table public.manga_chapters
      add constraint anihoshi_manga_chapters_manga_id_fkey_v1
      foreign key (manga_id) references public.mangas(id) on delete cascade not valid;
  end if;
end;
$$;
