-- User-owned data is keyed by auth.users.id, never by a mutable email address.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id text references public.animes(id) on delete cascade,
  manga_id text references public.mangas(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_one_content check ((anime_id is not null) <> (manga_id is not null))
);
create unique index if not exists favorites_user_anime_unique
  on public.favorites (user_id, anime_id) where anime_id is not null;
create unique index if not exists favorites_user_manga_unique
  on public.favorites (user_id, manga_id) where manga_id is not null;
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_anime_id_idx on public.favorites (anime_id) where anime_id is not null;
create index if not exists favorites_manga_id_idx on public.favorites (manga_id) where manga_id is not null;

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id text references public.animes(id) on delete cascade,
  manga_id text references public.mangas(id) on delete cascade,
  value smallint not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratings_one_content check ((anime_id is not null) <> (manga_id is not null))
);
create unique index if not exists ratings_user_anime_unique
  on public.ratings (user_id, anime_id) where anime_id is not null;
create unique index if not exists ratings_user_manga_unique
  on public.ratings (user_id, manga_id) where manga_id is not null;
create index if not exists ratings_anime_lookup_idx
  on public.ratings (anime_id) where anime_id is not null;
create index if not exists ratings_manga_lookup_idx
  on public.ratings (manga_id) where manga_id is not null;
create index if not exists ratings_user_id_idx on public.ratings (user_id);

create table if not exists public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  manga_id text not null references public.mangas(id) on delete cascade,
  chapter_id text,
  chapter_number numeric,
  reading_mode text not null default 'manga' check (reading_mode in ('manga', 'comic', 'manhwa')),
  updated_at timestamptz not null default now(),
  primary key (user_id, manga_id),
  constraint reading_progress_chapter_matches_manga_fkey
    foreign key (manga_id, chapter_id)
    references public.manga_chapters(manga_id, id)
    on delete set null (chapter_id)
);
create index if not exists reading_progress_manga_id_idx on public.reading_progress (manga_id);
create index if not exists reading_progress_chapter_id_idx on public.reading_progress (chapter_id) where chapter_id is not null;

create table if not exists public.reading_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  manga_id text not null references public.mangas(id) on delete cascade,
  chapter_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, manga_id, chapter_id),
  constraint reading_history_chapter_matches_manga_fkey
    foreign key (manga_id, chapter_id)
    references public.manga_chapters(manga_id, id)
    on delete cascade
);
create index if not exists reading_history_manga_id_idx on public.reading_history (manga_id);
create index if not exists reading_history_chapter_id_idx on public.reading_history (chapter_id);

create table if not exists public.watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id text not null references public.anime_episodes(id) on delete cascade,
  watched_at timestamptz not null default now(),
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed boolean not null default false,
  primary key (user_id, episode_id)
);
create index if not exists watch_history_episode_id_idx on public.watch_history (episode_id);

-- Publish only aggregates with at least five ratings. Individual ratings stay
-- private and no callable SECURITY DEFINER RPC is exposed through public.
create table if not exists public.rating_summaries (
  content_type text not null check (content_type in ('anime', 'manga')),
  content_id text not null,
  average numeric(3, 2) not null,
  rating_count bigint not null check (rating_count >= 5),
  updated_at timestamptz not null default now(),
  primary key (content_type, content_id)
);

create schema if not exists anihoshi_internal_v1;
revoke all on schema anihoshi_internal_v1 from public, anon, authenticated;

create function anihoshi_internal_v1.refresh_rating_summary_v1(p_content_type text, p_content_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_average numeric;
  v_count bigint;
begin
  if p_content_type is null or p_content_type not in ('anime', 'manga') or p_content_id is null then
    raise exception 'Invalid rating summary key';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_content_type || ':' || p_content_id, 0)
  );

  if p_content_type = 'anime' then
    select pg_catalog.avg(r.value)::numeric, pg_catalog.count(*)
      into v_average, v_count
      from public.ratings as r where r.anime_id = p_content_id;
  else
    select pg_catalog.avg(r.value)::numeric, pg_catalog.count(*)
      into v_average, v_count
      from public.ratings as r where r.manga_id = p_content_id;
  end if;

  if v_count < 5 then
    delete from public.rating_summaries
      where content_type = p_content_type and content_id = p_content_id;
  else
    insert into public.rating_summaries (content_type, content_id, average, rating_count)
    values (p_content_type, p_content_id, pg_catalog.round(v_average, 2), v_count)
    on conflict (content_type, content_id) do update
      set average = excluded.average,
          rating_count = excluded.rating_count,
          updated_at = pg_catalog.now();
  end if;
end;
$$;
revoke all on function anihoshi_internal_v1.refresh_rating_summary_v1(text, text)
  from public, anon, authenticated;

create function anihoshi_internal_v1.maintain_rating_summary_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_type text;
  v_old_id text;
  v_new_type text;
  v_new_id text;
begin
  if tg_op = 'INSERT' then
    v_new_type := case when new.anime_id is not null then 'anime' else 'manga' end;
    v_new_id := coalesce(new.anime_id, new.manga_id);
    perform anihoshi_internal_v1.refresh_rating_summary_v1(v_new_type, v_new_id);
    return new;
  elsif tg_op = 'DELETE' then
    v_old_type := case when old.anime_id is not null then 'anime' else 'manga' end;
    v_old_id := coalesce(old.anime_id, old.manga_id);
    perform anihoshi_internal_v1.refresh_rating_summary_v1(v_old_type, v_old_id);
    return old;
  end if;

  v_old_type := case when old.anime_id is not null then 'anime' else 'manga' end;
  v_old_id := coalesce(old.anime_id, old.manga_id);
  v_new_type := case when new.anime_id is not null then 'anime' else 'manga' end;
  v_new_id := coalesce(new.anime_id, new.manga_id);

  if v_old_type = v_new_type and v_old_id = v_new_id then
    perform anihoshi_internal_v1.refresh_rating_summary_v1(v_new_type, v_new_id);
  elsif (v_old_type || ':' || v_old_id) < (v_new_type || ':' || v_new_id) then
    perform anihoshi_internal_v1.refresh_rating_summary_v1(v_old_type, v_old_id);
    perform anihoshi_internal_v1.refresh_rating_summary_v1(v_new_type, v_new_id);
  else
    perform anihoshi_internal_v1.refresh_rating_summary_v1(v_new_type, v_new_id);
    perform anihoshi_internal_v1.refresh_rating_summary_v1(v_old_type, v_old_id);
  end if;

  return new;
end;
$$;
revoke all on function anihoshi_internal_v1.maintain_rating_summary_v1()
  from public, anon, authenticated;

do $$
begin
  if exists (
    select 1 from pg_trigger
    where tgrelid = 'public.ratings'::regclass
      and tgname = 'anihoshi_maintain_rating_summary_v1'
      and not tgisinternal
      and tgfoid <> 'anihoshi_internal_v1.maintain_rating_summary_v1()'::regprocedure
  ) then
    raise exception 'A ratings trigger already uses anihoshi_maintain_rating_summary_v1 with another function.';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.ratings'::regclass
      and tgname = 'anihoshi_maintain_rating_summary_v1'
      and not tgisinternal
  ) then
    create trigger anihoshi_maintain_rating_summary_v1
      after insert or update or delete on public.ratings
      for each row execute function anihoshi_internal_v1.maintain_rating_summary_v1();
  end if;
end;
$$;

-- Build privacy-suppressed aggregates for any ratings that predate the trigger.
do $$
declare
  rating_target record;
begin
  for rating_target in
    select 'anime'::text as content_type, r.anime_id as content_id
      from public.ratings as r where r.anime_id is not null group by r.anime_id
    union all
    select 'manga'::text as content_type, r.manga_id as content_id
      from public.ratings as r where r.manga_id is not null group by r.manga_id
  loop
    perform anihoshi_internal_v1.refresh_rating_summary_v1(rating_target.content_type, rating_target.content_id);
  end loop;
end;
$$;

create function anihoshi_internal_v1.create_profile_after_signup_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function anihoshi_internal_v1.create_profile_after_signup_v1() from public, anon, authenticated;

do $$
begin
  if exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'anihoshi_create_profile_after_signup_v1'
      and not tgisinternal
      and tgfoid <> 'anihoshi_internal_v1.create_profile_after_signup_v1()'::regprocedure
  ) then
    raise exception 'An auth.users trigger already uses anihoshi_create_profile_after_signup_v1 with another function.';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'anihoshi_create_profile_after_signup_v1'
      and not tgisinternal
  ) then
    create trigger anihoshi_create_profile_after_signup_v1
      after insert on auth.users
      for each row execute function anihoshi_internal_v1.create_profile_after_signup_v1();
  end if;
end;
$$;
