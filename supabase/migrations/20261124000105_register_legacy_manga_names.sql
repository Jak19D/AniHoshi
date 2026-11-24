-- Register the existing "slug-capitulo-01-title.pdf.pdf" manga naming style.
-- This trigger only touches the manga-chapters bucket; video automation is unchanged.
create or replace function public.register_legacy_manga_upload_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  object_name text;
  parts text[];
  content_slug text;
  content_id text;
  content_title text;
  chapter_no integer;
begin
  if tg_op = 'DELETE' then
    update public.manga_chapters set pdf_path = null where pdf_path = old.name;
    return old;
  end if;

  if tg_op = 'UPDATE' and (old.name is distinct from new.name or old.bucket_id is distinct from new.bucket_id) then
    if old.bucket_id = 'manga-chapters' then
      update public.manga_chapters set pdf_path = null where pdf_path = old.name;
    end if;
    if new.bucket_id <> 'manga-chapters' then return new; end if;
  end if;

  object_name := new.name;
  parts := pg_catalog.regexp_match(
    object_name,
    '^([a-z0-9]+(-[a-z0-9]+)*)-capitulo-0*([0-9]{1,4})(-[a-z0-9]+)*\.pdf(\.pdf)?$',
    'i'
  );
  if parts is null then return new; end if;

  content_slug := pg_catalog.lower(parts[1]);
  chapter_no := parts[3]::integer;
  content_title := pg_catalog.initcap(pg_catalog.replace(content_slug, '-', ' '));

  -- The app's canonical catalog calls this work Demon Slayer, while its
  -- Portuguese/Japanese upload filename uses the alias Kimetsu no Yaiba.
  if content_slug in ('kimetsu-no-yaiba', 'demon-slayer') then
    select id into content_id from public.mangas where id = 'manga-4' limit 1;
  end if;

  if content_id is null then
    select id into content_id
    from public.mangas
    where pg_catalog.lower(pg_catalog.regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) = content_slug
    order by id
    limit 1;
  end if;

  if content_id is null then
    content_id := content_slug;
    insert into public.mangas (id, title)
    values (content_id, content_title)
    on conflict (id) do nothing;
  end if;

  insert into public.manga_chapters (id, manga_id, number, title, pdf_path)
  values (
    content_id || '-ch-' || pg_catalog.lpad(chapter_no::text, 2, '0'),
    content_id,
    chapter_no,
    'Capítulo ' || pg_catalog.lpad(chapter_no::text, 2, '0'),
    object_name
  )
  on conflict (manga_id, number)
  do update set pdf_path = excluded.pdf_path;

  return new;
end;
$$;

drop trigger if exists anihoshi_register_legacy_manga_insert_v1 on storage.objects;
create trigger anihoshi_register_legacy_manga_insert_v1
  after insert on storage.objects
  for each row
  when (new.bucket_id = 'manga-chapters')
  execute function public.register_legacy_manga_upload_v1();

drop trigger if exists anihoshi_register_legacy_manga_update_v1 on storage.objects;
create trigger anihoshi_register_legacy_manga_update_v1
  after update of name, bucket_id on storage.objects
  for each row
  when (new.bucket_id = 'manga-chapters' or old.bucket_id = 'manga-chapters')
  execute function public.register_legacy_manga_upload_v1();

drop trigger if exists anihoshi_register_legacy_manga_delete_v1 on storage.objects;
create trigger anihoshi_register_legacy_manga_delete_v1
  after delete on storage.objects
  for each row
  when (old.bucket_id = 'manga-chapters')
  execute function public.register_legacy_manga_upload_v1();

revoke all on function public.register_legacy_manga_upload_v1() from public, anon, authenticated;

-- Re-process already uploaded files that use this older naming pattern.
update storage.objects as uploaded
set name = uploaded.name
where uploaded.bucket_id = 'manga-chapters'
  and uploaded.name ~* '^[a-z0-9]+(-[a-z0-9]+)*-capitulo-0*[0-9]{1,4}(-[a-z0-9]+)*\.pdf(\.pdf)?$';
